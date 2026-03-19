import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PresenceService } from './presence.service';

@Controller('presence')
@UseGuards(JwtAuthGuard)
export class PresenceController {
    constructor(private readonly presenceService: PresenceService) { }

    @Post('heartbeat')
    heartbeat(@Req() req: Request) {
        const user: any = (req as any).user;
        this.presenceService.heartbeat({
            userId: user.userId,
            role: user.role,
            username: user.username,
            name: user.name,
            email: user.email,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] || 'Unknown',
        });
        return { ok: true };
    }

    @Get(':userId')
    getPresence(@Param('userId') userId: string) {
        return this.presenceService.getPresence(userId) || {
            userId,
            isOnline: false,
            lastSeenAt: null,
        };
    }

    @Post('offline')
    offline(@Req() req: Request) {
        const user: any = (req as any).user;
        this.presenceService.markOffline(user.userId);
        return { ok: true };
    }
}
