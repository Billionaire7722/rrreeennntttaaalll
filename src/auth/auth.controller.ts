import { Controller, Post, Body, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    register(@Body() registerDto: RegisterDto, @Req() req: Request) {
        return this.authService.register(registerDto, req.ip, req.headers['user-agent']);
    }

    @Post('login')
    login(@Body() loginDto: LoginDto, @Req() req: Request) {
        return this.authService.login(loginDto, req.ip, req.headers['user-agent']);
    }

    @Post('google')
    googleLogin(@Body() body: { email: string, name: string }) {
        return this.authService.mockupGoogleLogin(body.email, body.name);
    }

    @Post('forgot-password')
    forgotPassword(@Body() body: { email: string }) {
        return this.authService.forgotPassword(body.email);
    }
}
