import { Controller, Post, Body, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../security/public.decorator';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ login: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = (req as any).clientIp || req.ip;
    const ua = (req as any).userAgent || req.headers['user-agent'];
    
    const result = await this.authService.adminLogin(loginDto, ip, ua);
    
    // Set Refresh Token in HTTP-Only Cookie
    res.cookie('admin_refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/admin/auth/refresh',
    });

    return {
      access_token: result.access_token,
      user: result.user,
    };
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['admin_refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const ip = (req as any).clientIp || req.ip;
    const ua = (req as any).userAgent || req.headers['user-agent'];

    const result = await this.authService.refreshAdminToken(refreshToken, ip, ua);

    res.cookie('admin_refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/admin/auth/refresh',
    });

    return {
      access_token: result.access_token,
    };
  }

  @Public()
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['admin_refresh_token'];
    if (refreshToken) {
      await this.authService.revokeRefreshToken(refreshToken);
    }
    
    res.clearCookie('admin_refresh_token', { path: '/admin/auth/refresh' });
    return { success: true };
  }
}
