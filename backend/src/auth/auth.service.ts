import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import { randomBytes, randomInt } from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '../security/roles.enum';
import { ActivityLogService } from '../admin/activity-log.service';

// Password validation regex patterns
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 12;

@Injectable()
export class AuthService {
    private readonly TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private activityLogService: ActivityLogService
    ) { }

    async adminLogin(loginDto: LoginDto, ipAddress: string, userAgent: string) {
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: loginDto.loginId.toLowerCase() },
                    { username: loginDto.loginId.toLowerCase() }
                ],
                role: Role.SUPER_ADMIN
            }
        });

        if (!user) {
            await this.recordAdminLoginAttempt(loginDto.loginId, ipAddress, userAgent, false);
            throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
        }

        // Check if account is locked
        if (user.locked_until && user.locked_until > new Date()) {
            throw new UnauthorizedException('Tài khoản đã bị khóa tạm thời. Thử lại sau 15 phút.');
        }

        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        
        if (!isPasswordValid) {
            await this.handleFailedAdminLogin(user, ipAddress, userAgent);
            throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
        }

        // Reset failed attempts on success
        await this.prisma.user.update({
            where: { id: user.id },
            data: { failed_attempts: 0, last_failed_attempt: null, locked_until: null } as any
        });

        await this.recordAdminLoginAttempt(user.email, ipAddress, userAgent, true);
        
        // Detect suspicious login (simplified check)
        await this.checkSuspiciousLogin(user, ipAddress);

        return this.generateAdminSession(user, ipAddress, userAgent);
    }

    private async handleFailedAdminLogin(user: any, ip: string, ua: string) {
        const failedAttempts = user.failed_attempts + 1;
        const now = new Date();
        const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
        
        let lockUntil: Date | null = null;
        if (failedAttempts >= 5 && (!user.last_failed_attempt || user.last_failed_attempt > tenMinutesAgo)) {
            lockUntil = new Date(now.getTime() + 15 * 60 * 1000);
            await this.recordSecurityEvent(user.id, 'multiple_failed_attempts', ip, null, `Account locked after ${failedAttempts} failed attempts`);
        }

        await this.prisma.user.update({
            where: { id: user.id },
            data: { 
                failed_attempts: failedAttempts, 
                last_failed_attempt: now,
                locked_until: lockUntil
            } as any
        });

        await this.recordAdminLoginAttempt(user.email, ip, ua, false);
    }

    private async recordAdminLoginAttempt(email: string, ip: string, ua: string, success: boolean) {
        await (this.prisma as any).adminLoginAttempt.create({
            data: { email, ipAddress: ip, userAgent: ua, success }
        });
    }

    private async checkSuspiciousLogin(user: any, ip: string) {
        // Find last successful login IP
        const lastLogin = await this.prisma.adminLoginAttempt.findFirst({
            where: { email: user.email, success: true, NOT: { ipAddress: ip } },
            orderBy: { createdAt: 'desc' }
        });

        if (lastLogin && lastLogin.ipAddress !== ip) {
            await this.recordSecurityEvent(user.id, 'new_login_location', ip, null, `Admin logged in from new IP: ${ip} (previous: ${lastLogin.ipAddress})`);
        }
    }

    private async generateAdminSession(user: any, ip: string, ua: string) {
        return this.createSession(user, ip, ua);
    }

    async refreshAdminToken(token: string, ip: string, ua: string) {
        const session = await this.getValidRefreshSession(token);

        if (session.user.role !== Role.SUPER_ADMIN) {
            throw new UnauthorizedException('Session expired');
        }

        return this.rotateRefreshSession(session, ip, ua);
    }

    async refreshUserToken(token: string, ip?: string, ua?: string) {
        const session = await this.getValidRefreshSession(token);

        if (session.user.role !== Role.USER || session.user.status !== 'ACTIVE') {
            throw new UnauthorizedException('Session expired');
        }

        return this.rotateRefreshSession(session, ip, ua);
    }

    async revokeRefreshToken(token: string) {
        await (this.prisma as any).refreshToken.updateMany({
            where: { token },
            data: { revokedAt: new Date() }
        });
    }

    async recordSecurityEvent(adminId: string, eventType: string, ip: string, country: string | null, description: string) {
        let detectedCountry = country;
        if (!detectedCountry && ip && ip !== '127.0.0.1' && ip !== '::1') {
            try {
                const geoRes = await axios.get(`https://ipapi.co/${ip}/json/`);
                detectedCountry = geoRes.data.country_name || null;
            } catch (e) {
                // Silently fail geo-location
            }
        }
        await (this.prisma as any).securityEvent.create({
            data: { admin_id: adminId, event_type: eventType, ip_address: ip, country: detectedCountry, description }
        });
    }

    async recordAdminAuditLog(adminId: string, action: string, targetType: string, targetId: string, ip: string, ua: string) {
        await (this.prisma as any).adminAuditLog.create({
            data: { admin_id: adminId, action, target_type: targetType, target_id: targetId, ip_address: ip, user_agent: ua }
        });
    }

    private async verifyCaptchaToken(captchaToken?: string) {
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

    private validatePassword(password: string): string[] {
        const errors: string[] = [];
        if (password.length < PASSWORD_MIN_LENGTH) errors.push(`Mật khẩu phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự`);
        if (password.length > PASSWORD_MAX_LENGTH) errors.push(`Mật khẩu không được quá ${PASSWORD_MAX_LENGTH} ký tự`);
        if (!/[A-Z]/.test(password)) errors.push('Mật khẩu phải có nhất một chữ hoa');
        if (!/[a-z]/.test(password)) errors.push('Mật khẩu phải có ít nhất một chữ thường');
        if (!/\d/.test(password)) errors.push('Mật khẩu phải có ít nhất một số');
        return errors;
    }

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
            if (existingUser.email === email.toLowerCase()) return { field: 'email', message: 'Email này đã được đăng ký' };
            if (existingUser.username === username.toLowerCase()) return { field: 'username', message: 'Tên đăng nhập này đã được sử dụng' };
        }
        return null;
    }

    async register(registerDto: RegisterDto, ipAddress?: string, userAgent?: string) {
        await this.verifyCaptchaToken(registerDto.captchaToken);
        const passwordErrors = this.validatePassword(registerDto.password);
        if (passwordErrors.length > 0) throw new BadRequestException({ message: passwordErrors.join('. '), errors: passwordErrors });
        if (registerDto.password !== registerDto.confirmPassword) throw new ConflictException('Mật khẩu xác nhận không khớp');

        const duplicateError = await this.checkDuplicateUser(registerDto.email, registerDto.username);
        if (duplicateError) throw new ConflictException(duplicateError.message);

        const hashedPassword = await bcrypt.hash(registerDto.password, 10);
        const newUser = await this.prisma.user.create({
            data: {
                firstName: registerDto.firstName,
                lastName: registerDto.lastName,
                name: `${registerDto.firstName} ${registerDto.lastName}`.trim(),
                username: registerDto.username.toLowerCase(),
                email: registerDto.email.toLowerCase(),
                phone: registerDto.phone,
                password: hashedPassword,
                role: Role.USER,
            },
        });

        await this.logLoginAttempt(newUser.id, newUser.role, true, ipAddress, userAgent);
        return this.createSession(newUser, ipAddress, userAgent);
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

        if (user.role === Role.USER) await this.verifyCaptchaToken(loginDto.captchaToken);
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
        return this.createSession(user, ipAddress, userAgent);
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

            if (userId) {
                await this.activityLogService.log(
                    userId, 
                    success ? 'login' : 'failed_login',
                    success ? 'User logged in successfully' : 'Failed login attempt',
                    { ip: ipAddress } as any
                );
            }
        } catch (e) {
            console.error('Failed to write login log', e);
        }
    }

    async mockupGoogleLogin(email: string, name: string) {
        let user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            const randomPasswordPlain = randomBytes(18).toString('base64url');
            const randomPassword = await bcrypt.hash(randomPasswordPlain, 10);
            const usernameSuffix = randomInt(1000, 10000);
            user = await this.prisma.user.create({
                data: {
                    email,
                    name,
                    username: `${email.split('@')[0]}${usernameSuffix}`,
                    password: randomPassword,
                    role: Role.USER
                }
            });
        }
        return this.createSession(user);
    }

    async forgotPassword(email: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) throw new UnauthorizedException('Email not found');
        return { message: 'Password reset link sent to your email', mock_token: this.jwtService.sign({ sub: user.id, reset: true }, { expiresIn: '10m' }) };
    }

    private buildJwtPayload(user: any) {
        return {
            username: user.username,
            sub: user.id,
            name: user.name,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            email: user.email,
            phone: user.phone,
        };
    }

    private buildTokenResponse(user: any) {
        const payload = this.buildJwtPayload(user);
        const accessToken = this.jwtService.sign(payload);

        return {
            access_token: accessToken,
            user: {
                id: user.id,
                name: user.name,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        };
    }

    private async createRefreshSession(user: any, ip?: string, ua?: string) {
        const refreshToken = randomBytes(40).toString('hex');

        await (this.prisma as any).refreshToken.create({
            data: {
                userId: user.id,
                token: refreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                ipAddress: ip || null,
                userAgent: ua || null,
            }
        });

        return refreshToken;
    }

    private async createSession(user: any, ip?: string, ua?: string) {
        const tokens = this.buildTokenResponse(user);
        const refreshToken = await this.createRefreshSession(user, ip, ua);

        return {
            ...tokens,
            refresh_token: refreshToken,
        };
    }

    private async getValidRefreshSession(token: string) {
        const session = await (this.prisma as any).refreshToken.findUnique({
            where: { token },
            include: { user: true }
        });

        if (!session || session.revokedAt || session.expiresAt < new Date()) {
            throw new UnauthorizedException('Session expired');
        }

        return session;
    }

    private async rotateRefreshSession(session: any, ip?: string, ua?: string) {
        await (this.prisma as any).refreshToken.update({
            where: { id: session.id },
            data: { revokedAt: new Date() }
        });

        return this.createSession(session.user, ip, ua);
    }
}

