import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../security/roles.guard';
import { Roles } from '../security/roles.decorator';
import { Role } from '../security/roles.enum';
import { ActivityLogService } from './activity-log.service';
import { PrismaService } from '../prisma/prisma.service'; // Added PrismaService import

@Controller('admin/monitoring')
@UseGuards(RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class MonitoringController {
    constructor(
        private monitoringService: MonitoringService,
        private activityLogService: ActivityLogService,
        private prisma: PrismaService // Added prisma to constructor
    ) {}

    @Get('heatmap')
    async getHeatmap() {
        return this.monitoringService.getTrafficHeatmap();
    }

    @Get('suspicious-ips')
    async getSuspiciousIPs() {
        // Trigger detection periodically or on request for demo
        await this.monitoringService.detectSuspiciousIPs();
        return this.prisma.suspiciousIP.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }

    @Get('fraud-alerts')
    async getFraudAlerts() {
        await this.monitoringService.detectFraud();
        return this.prisma.fraudAlert.findMany({
            include: { user: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    @Get('property-fraud-alerts')
    async getPropertyFraudAlerts() {
        return this.prisma.propertyFraudAlert.findMany({
            include: {
                property: true,
                owner: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    @Get('users/:id/timeline')
    async getTimeline(@Param('id') userId: string, @Query('range') range: string) {
        return this.activityLogService.getUserTimeline(userId, range);
    }

    @Get('risk-users')
    async getRiskUsers() {
        // Process top 50 users for risk score for demo
        const users = await this.prisma.user.findMany({
            where: { status: 'ACTIVE' },
            select: { id: true }
        });

        for (const user of users) {
            await this.monitoringService.calculateUserRiskScore(user.id);
        }

        return this.prisma.userRiskScore.findMany({
            include: { user: true },
            orderBy: { score: 'desc' }
        });
    }

    @Post('alerts/:id/status')
    async updateAlertStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.prisma.fraudAlert.update({
            where: { id },
            data: { status }
        });
    }

    @Post('property-alerts/:id/status')
    async updatePropertyAlertStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.prisma.propertyFraudAlert.update({
            where: { id },
            data: { status }
        });
    }

    @Post('ips/:id/status')
    async updateIPStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.monitoringService['prisma'].suspiciousIP.update({
            where: { id },
            data: { status }
        });
    }
}
