import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
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

    @Post('offline')
    offline(@Body() body: { userId?: string }, @Req() req: Request) {
        const user: any = (req as any).user;
        const targetUserId = body?.userId || user.userId;
        this.presenceService.markOffline(targetUserId);
        return { ok: true };
    }
}
