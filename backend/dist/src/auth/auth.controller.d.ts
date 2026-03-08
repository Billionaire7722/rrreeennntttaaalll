import type { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto, req: Request): Promise<{
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
    login(loginDto: LoginDto, req: Request): Promise<{
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
    googleLogin(body: {
        email: string;
        name: string;
    }): Promise<{
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
    forgotPassword(body: {
        email: string;
    }): Promise<{
        message: string;
        mock_token: string;
    }>;
}
