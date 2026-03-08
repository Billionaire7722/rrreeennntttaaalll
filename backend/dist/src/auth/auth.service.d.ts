import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    private readonly MAX_LOGIN_ATTEMPTS;
    private readonly LOCK_DURATION_MINUTES;
    private readonly TURNSTILE_VERIFY_URL;
    constructor(prisma: PrismaService, jwtService: JwtService);
    private verifyCaptchaToken;
    private validatePassword;
    private checkDuplicateUser;
    register(registerDto: RegisterDto, ipAddress?: string, userAgent?: string): Promise<{
        access_token: string;
        user: {
            id: any;
            name: any;
            firstName: any;
            lastName: any;
            username: any;
            email: any;
            phone: any;
            role: any;
        };
    }>;
    private countRecentFailedAttempts;
    login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<{
        access_token: string;
        user: {
            id: any;
            name: any;
            firstName: any;
            lastName: any;
            username: any;
            email: any;
            phone: any;
            role: any;
        };
    }>;
    private logLoginAttempt;
    mockupGoogleLogin(email: string, name: string): Promise<{
        access_token: string;
        user: {
            id: any;
            name: any;
            firstName: any;
            lastName: any;
            username: any;
            email: any;
            phone: any;
            role: any;
        };
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
        mock_token: string;
    }>;
    private generateToken;
}
