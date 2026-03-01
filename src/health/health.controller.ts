import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Controller()
export class HealthController {
    constructor(private readonly prisma: PrismaService) { }

    @Get()
    getApiRoot(@Res() res: Response) {
        const uptimeSeconds = process.uptime();
        const env = process.env.NODE_ENV || 'development';

        return res.status(200).json({
            serviceName: 'Rental API',
            version: '1.0.0',
            environment: env,
            uptime: uptimeSeconds,
            currentServerTime: new Date().toISOString(),
            description: 'The core backend API for the Rental platform. Provides property management and user data functionality.'
        });
    }

    @Get('health')
    async getHealth(@Res() res: Response) {
        let databaseStatus = 'disconnected';
        let statusCode = 503;

        try {
            await this.prisma.$queryRaw`SELECT 1`;
            databaseStatus = 'connected';
            statusCode = 200;
        } catch (error) {
            console.error("Health check database ping failed:", error);
            databaseStatus = 'disconnected';
        }

        return res.status(statusCode).json({
            serverStatus: 'connected',
            databaseStatus,
            timestamp: new Date().toISOString(),
        });
    }
}
