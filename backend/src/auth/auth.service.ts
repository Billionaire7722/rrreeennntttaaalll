import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '../security/roles.enum';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService
    ) { }

    async register(registerDto: RegisterDto, ipAddress?: string, userAgent?: string) {
        if (registerDto.password !== registerDto.confirmPassword) {
            throw new ConflictException('Passwords do not match');
        }

        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: registerDto.email },
                    { username: registerDto.username }
                ]
            }
        });

        if (existingUser) {
            throw new ConflictException('Username or email already exists');
        }

        const hashedPassword = await bcrypt.hash(registerDto.password, 10);

        const newUser = await this.prisma.user.create({
            data: {
                name: registerDto.name,
                username: registerDto.username,
                email: registerDto.email,
                phone: registerDto.phone,
                password: hashedPassword,
                role: Role.VIEWER,
            },
        });

        // Log the successful registration and auto-login
        await this.logLoginAttempt(newUser.id, newUser.role, true, ipAddress, userAgent);

        return this.generateToken(newUser);
    }

    async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: loginDto.loginId },
                    { username: loginDto.loginId }
                ]
            }
        });

        if (!user) {
            await this.logLoginAttempt(null, null, false, ipAddress, userAgent);
            throw new UnauthorizedException('Invalid credentials');
        }

        // Check if account is suspended or locked
        if (user.status !== 'ACTIVE') {
            await this.logLoginAttempt(user.id, user.role, false, ipAddress, userAgent);
            throw new UnauthorizedException('Account is suspended');
        }

        if (user.locked_until && new Date() < user.locked_until) {
            await this.logLoginAttempt(user.id, user.role, false, ipAddress, userAgent);
            throw new UnauthorizedException(`Account is locked until ${user.locked_until.toISOString()}`);
        }

        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

        if (!isPasswordValid) {
            await this.logLoginAttempt(user.id, user.role, false, ipAddress, userAgent);
            throw new UnauthorizedException('Invalid credentials');
        }

        // Clear locked_until if it was set in the past
        if (user.locked_until && new Date() >= user.locked_until) {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { locked_until: null }
            });
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
                    role: Role.VIEWER
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
