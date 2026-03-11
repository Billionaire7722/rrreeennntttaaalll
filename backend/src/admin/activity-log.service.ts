import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Request } from 'express';

@Injectable()
export class ActivityLogService {
    constructor(private prisma: PrismaService) {}

    async log(userId: string, activityType: string, description: string, req?: Request) {
        try {
            const ipAddress = req?.ip || req?.headers['x-forwarded-for']?.toString() || 'unknown';
            
            // Try to get country if possible (simplified for now, could use geoip)
            let country = 'Unknown';
            // In a real app, you might use a geoip library or the monitoring service's logic

            await this.prisma.userActivityLog.create({
                data: {
                    userId,
                    activityType,
                    description,
                    ipAddress,
                    country
                }
            });
        } catch (error) {
            console.error('Failed to create user activity log:', error);
        }
    }

    async getUserTimeline(userId: string, range: string = 'all') {
        const where: any = { userId };
        
        if (range !== 'all') {
            const now = new Date();
            if (range === '24h') {
                where.createdAt = { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) };
            } else if (range === '7d') {
                where.createdAt = { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
            } else if (range === '30d') {
                where.createdAt = { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
            }
        }

        return this.prisma.userActivityLog.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
    }
}
