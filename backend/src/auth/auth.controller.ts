import { Controller, Post, Body, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '../security/public.decorator';

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

    @Public()
    @Post('refresh')
    refresh(@Body() body: { refreshToken?: string }, @Req() req: Request) {
        if (!body?.refreshToken) {
            throw new UnauthorizedException('Refresh token missing');
        }

        return this.authService.refreshUserToken(body.refreshToken, req.ip, req.headers['user-agent']);
    }

    @Public()
    @Post('logout')
    async logout(@Body() body: { refreshToken?: string }) {
        if (body?.refreshToken) {
            await this.authService.revokeRefreshToken(body.refreshToken);
        }

        return { success: true };
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
