import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { Role } from './roles.enum';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AbnormalActivityGuard implements CanActivate {
    // Store destructive actions per user within a specific time window
    // In a multi-instance production environment, this should use Redis
    private actionLog: Map<string, number[]> = new Map();

    // Settings: max 10 destructive actions per 60 seconds
    private readonly WINDOW_MS = 60 * 1000;
    private readonly MAX_ACTIONS = 10;

    constructor(
        @Inject(forwardRef(() => PrismaService))
        private prisma: PrismaService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const { user, method } = req;

        // We only care about destructive actions
        if (method !== 'DELETE' && method !== 'PATCH' && method !== 'POST') {
            return true;
        }

        // We only monitor ADMINs for abnormal activity (SUPER_ADMIN is exempt, VIEWERs don't have access to these endpoints)
        if (!user || user.role !== Role.ADMIN) {
            return true;
        }

        const now = Date.now();
        const userId = user.userId; // JWT payload usually uses userId or id. Assume userId.

        if (!this.actionLog.has(userId)) {
            this.actionLog.set(userId, []);
        }

        const timestamps = this.actionLog.get(userId)!;

        // Filter out timestamps older than the window
        const recentTimestamps = timestamps.filter(t => now - t < this.WINDOW_MS);

        if (recentTimestamps.length >= this.MAX_ACTIONS) {
            // Threshold exceeded, temporarily lock the account (e.g., for 15 minutes)
            const lockDurationMs = 15 * 60 * 1000;
            const lockedUntil = new Date(now + lockDurationMs);

            await this.prisma.user.update({
                where: { id: userId },
                data: { locked_until: lockedUntil }
            });

            // Log the abnormal activity
            await this.prisma.auditLog.create({
                data: {
                    actorId: userId,
                    actorRole: user.role,
                    actionType: 'ACCOUNT_LOCKED_ABNORMAL_ACTIVITY',
                    entityType: 'User',
                    entityId: userId,
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'] || 'Unknown',
                    beforeData: JSON.stringify({ timestamps: recentTimestamps }),
                }
            });

            // Clear the log for this user to prevent continuous locking on subsequent blocked requests
            this.actionLog.delete(userId);

            throw new ForbiddenException(`Abnormal activity detected. Account locked until ${lockedUntil.toISOString()}`);
        }

        // Log this action
        recentTimestamps.push(now);
        this.actionLog.set(userId, recentTimestamps);

        return true;
    }
}
