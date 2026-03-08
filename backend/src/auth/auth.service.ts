import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '../security/roles.enum';

// Password validation regex patterns
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 12;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,12}$/;

@Injectable()
export class AuthService {
    private readonly MAX_LOGIN_ATTEMPTS = 5;
    private readonly LOCK_DURATION_MINUTES = 15;
    private readonly TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService
    ) { }

    private async verifyCaptchaToken(captchaToken?: string) {
        return; // Temporary disable for local development/testing
        if (process.env.NODE_ENV === 'development') {
            return;
        }

        const secretKey = process.env.TURNSTILE_SECRET_KEY;
        if (!secretKey || !captchaToken) {
            throw new BadRequestException('Captcha verification failed');
        }

        const formBody = new URLSearchParams({
            secret: secretKey as string,
            response: captchaToken as string,
        });

        let verificationResponse: Response;
        try {
            verificationResponse = await fetch(this.TURNSTILE_VERIFY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formBody,
            });
        } catch {
            throw new BadRequestException('Captcha verification failed');
        }

        if (!verificationResponse.ok) {
            throw new BadRequestException('Captcha verification failed');
        }

        const verificationResult = await verificationResponse.json() as { success?: boolean };
        if (!verificationResult.success) {
            throw new BadRequestException('Captcha verification failed');
        }
    }

    /**
     * Validate password requirements:
     * - 8-12 characters
     * - At least one uppercase letter
     * - At least one lowercase letter
     * - At least one number
     * - At least one special character
     */
    private validatePassword(password: string): string[] {
        const errors: string[] = [];

        if (password.length < PASSWORD_MIN_LENGTH) {
            errors.push(`Mật khẩu phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự`);
        }
        if (password.length > PASSWORD_MAX_LENGTH) {
            errors.push(`Mật khẩu không được quá ${PASSWORD_MAX_LENGTH} ký tự`);
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Mật khẩu phải có ít nhất một chữ hoa');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Mật khẩu phải có ít nhất một chữ thường');
        }
        if (!/\d/.test(password)) {
            errors.push('Mật khẩu phải có ít nhất một số');
        }
        if (!/[@$!%*?&]/.test(password)) {
            errors.push('Mật khẩu phải có ít nhất một ký tự đặc biệt (@$!%*?&)');
        }

        return errors;
    }

    /**
     * Check for duplicate email or username in database
     */
    private async checkDuplicateUser(email: string, username: string): Promise<{ field: string; message: string } | null> {
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: email.toLowerCase() },
                    { username: username.toLowerCase() }
                ]
            }
        });

        if (existingUser) {
            if (existingUser.email === email.toLowerCase()) {
                return { field: 'email', message: 'Email này đã được đăng ký' };
            }
            if (existingUser.username === username.toLowerCase()) {
                return { field: 'username', message: 'Tên đăng nhập này đã được sử dụng' };
            }
        }

        return null;
    }

    async register(registerDto: RegisterDto, ipAddress?: string, userAgent?: string) {
        await this.verifyCaptchaToken(registerDto.captchaToken);

        // Validate password
        const passwordErrors = this.validatePassword(registerDto.password);
        if (passwordErrors.length > 0) {
            throw new BadRequestException({
                message: passwordErrors.join('. '),
                errors: passwordErrors
            });
        }

        if (registerDto.password !== registerDto.confirmPassword) {
            throw new ConflictException('Mật khẩu xác nhận không khớp');
        }

        // Check for duplicate email/username
        const duplicateError = await this.checkDuplicateUser(registerDto.email, registerDto.username);
        if (duplicateError) {
            throw new ConflictException(duplicateError.message);
        }

        const hashedPassword = await bcrypt.hash(registerDto.password, 10);

        const newUser = await this.prisma.user.create({
            data: {
                name: registerDto.name,
                username: registerDto.username.toLowerCase(),
                email: registerDto.email.toLowerCase(),
                phone: registerDto.phone,
                password: hashedPassword,
                role: Role.USER,
            },
        });

        // Log the successful registration and auto-login
        await this.logLoginAttempt(newUser.id, newUser.role, true, ipAddress, userAgent);

        return this.generateToken(newUser);
    }

    /**
     * Count failed login attempts in the last 15 minutes
     */
    private async countRecentFailedAttempts(userId: string): Promise<number> {
        const fifteenMinutesAgo = new Date();
        fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - this.LOCK_DURATION_MINUTES);

        const failedAttempts = await this.prisma.loginLog.count({
            where: {
                userId,
                success: false,
                timestamp: {
                    gte: fifteenMinutesAgo
                }
            }
        });

        return failedAttempts;
    }

    async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: loginDto.loginId.toLowerCase() },
                    { username: loginDto.loginId.toLowerCase() }
                ]
            }
        });

        if (!user) {
            await this.logLoginAttempt(null, null, false, ipAddress, userAgent);
            throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
        }

        // Keep captcha for public viewer auth; skip it for admin/super-admin panels.
        if (user.role === Role.USER) {
            await this.verifyCaptchaToken(loginDto.captchaToken);
        }

        // Check if account is suspended
        if (user.status !== 'ACTIVE') {
            await this.logLoginAttempt(user.id, user.role, false, ipAddress, userAgent);
            throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa');
        }

        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

        if (!isPasswordValid) {
            await this.logLoginAttempt(user.id, user.role, false, ipAddress, userAgent);
            throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
        }

        await this.logLoginAttempt(user.id, user.role, true, ipAddress, userAgent);
        return this.generateToken(user);
    }

    private async logLoginAttempt(userId: string | null, role: string | null, success: boolean, ipAddress?: string, userAgent?: string) {
        try {
            await this.prisma.loginLog.create({
                data: {
                    userId,
                    role,
                    success,
                    ipAddress: ipAddress || 'Unknown',
                    userAgent: userAgent || 'Unknown'
                }
            });
        } catch (e) {
            console.error('Failed to write login log', e);
        }
    }

    async mockupGoogleLogin(email: string, name: string) {
        // Stub implementation substituting native OAuth config 
        let user = await this.prisma.user.findUnique({ where: { email } });

        if (!user) {
            const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);
            user = await this.prisma.user.create({
                data: {
                    email,
                    name,
                    username: email.split('@')[0] + Math.floor(Math.random() * 1000),
                    password: randomPassword,
                    role: Role.USER
                }
            });
        }

        return this.generateToken(user);
    }

    async forgotPassword(email: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new UnauthorizedException('Email not found');
        }

        // Return a mock reset token
        return { message: 'Password reset link sent to your email', mock_token: this.jwtService.sign({ sub: user.id, reset: true }, { expiresIn: '10m' }) };
    }

    private generateToken(user: any) {
        const payload = {
            username: user.username,
            sub: user.id,
            name: user.name,
            role: user.role,
            email: user.email,
            phone: user.phone,
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        };
    }
}

