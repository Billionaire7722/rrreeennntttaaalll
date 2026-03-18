import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class MonitoringService {
    private readonly logger = new Logger(MonitoringService.name);

    constructor(public prisma: PrismaService) {}

    /**
     * Calculate and update risk score for a single user
     */
    async calculateUserRiskScore(userId: string) {
        // 1. Failed Logins
        const failedLogins = await this.prisma.loginLog.count({
            where: { userId, success: false }
        });

        // 2. Reports against user
        const reportCount = await this.prisma.userReport.count({
            where: { targetId: userId }
        });

        // 3. Properties deleted by admin (AuditLog)
        const deletedProperties = await this.prisma.auditLog.count({
            where: { 
                actionType: 'DELETE_PROPERTY',
                entityType: 'PROPERTY',
                entityId: {
                    in: await this.prisma.house.findMany({
                        where: { owner_id: userId },
                        select: { id: true }
                    }).then(houses => houses.map(h => h.id))
                }
            }
        });

        // 4. IP Geolocation variety
        const uniqueIps = await this.prisma.loginLog.findMany({
            where: { userId, success: true },
            distinct: ['ipAddress'],
            select: { ipAddress: true }
        });

        // 5. Property Fraud Alerts
        const propertyFraudCount = await this.prisma.propertyFraudAlert.count({
            where: { ownerId: userId, severity: { in: ['HIGH', 'CRITICAL'] } }
        });

        // Scoring Logic
        let score = 0;
        const factors: any = {};

        if (failedLogins > 5) {
            score += 15;
            factors.failed_logins = 15;
        }
        if (reportCount > 3) {
            score += 20;
            factors.reports = 20;
        }
        if (deletedProperties > 2) {
            score += 15;
            factors.deleted_properties = 15;
        }
        if (uniqueIps.length > 3) {
            score += 20;
            factors.ip_variety = 20;
        }
        if (propertyFraudCount > 0) {
            const fraudWeight = Math.min(propertyFraudCount * 25, 50);
            score += fraudWeight;
            factors.property_fraud = fraudWeight;
        }

        // Cap at 100
        score = Math.min(score, 100);

        // Update or Create score
        return this.prisma.userRiskScore.upsert({
            where: { userId },
            update: { score, factors },
            create: { userId, score, factors }
        });
    }

    /**
     * Detect suspicious property listings
     */
    async detectPropertyFraud(propertyId: string) {
        const property = await this.prisma.house.findUnique({
            where: { id: propertyId },
            include: { owner: true }
        });

        if (!property || !property.owner_id) return;

        const ownerId = property.owner_id;

        // Rule 1: Rapid creation (5 properties in 10 mins)
        const tenMinsAgo = new Date(Date.now() - 600000);
        const recentCount = await this.prisma.house.count({
            where: { owner_id: ownerId, created_at: { gte: tenMinsAgo } }
        });

        if (recentCount > 5) {
            await this.createPropertyFraudAlert(propertyId, ownerId, 'rapid_property_creation', 'User is posting properties too rapidly (Spam detection)', 'HIGH');
        }

        // Rule 2: Duplicate Title/Description (Exact Match for now)
        const duplicates = await this.prisma.house.count({
            where: { 
                id: { not: propertyId },
                name: property.name,
                owner_id: ownerId,
                status: { not: 'DELETED' }
            }
        });

        if (duplicates > 0) {
            await this.createPropertyFraudAlert(propertyId, ownerId, 'duplicate_listing', 'Property has exactly the same title as another listing from this user', 'MEDIUM');
        }

        // Rule 3: Price Anomaly (Luxury property for suspiciously low price)
        // Simple logic: if 'luxury' in description but price < 1,000,000 (just an example threshold)
        const description = (property.description || '').toLowerCase();
        if ((description.includes('luxury') || description.includes('premium')) && (property.price || 0) < 500000) {
            await this.createPropertyFraudAlert(propertyId, ownerId, 'price_anomaly', 'Luxury keywords detected but price is extremely low', 'CRITICAL');
        }

        // Rule 4: High Report Count (Already handled by individual report creation usually, but we check here)
        const reportCount = await this.prisma.propertyReport.count({
            where: { houseId: propertyId }
        });

        if (reportCount > 3) {
            await this.createPropertyFraudAlert(propertyId, ownerId, 'high_report_count', 'Property has received more than 3 user reports', 'HIGH');
        }

        // Finally, trigger risk score recalculation
        await this.calculateUserRiskScore(ownerId);
    }

    private async createPropertyFraudAlert(propertyId: string, ownerId: string, fraudType: string, description: string, severity: string) {
        const existing = await this.prisma.propertyFraudAlert.findFirst({
            where: { propertyId, fraudType }
        });

        if (!existing) {
            return this.prisma.propertyFraudAlert.create({
                data: { propertyId, ownerId, fraudType, description, severity }
            });
        }
    }

    /**
     * Detect and log fraud alerts based on recent login activity
     */
// ... (rest same)
    async detectFraud(userId?: string) {
        const usersToProcess = userId ? [userId] : await this.prisma.user.findMany({
            where: { status: 'ACTIVE' },
            select: { id: true }
        }).then(users => users.map(u => u.id));

        for (const uid of usersToProcess) {
            // Rule 1: Multiple failed logins in last hour
            const hourAgo = new Date(Date.now() - 3600000);
            const recentFailedLogins = await this.prisma.loginLog.count({
                where: { userId: uid, success: false, timestamp: { gte: hourAgo } }
            });

            if (recentFailedLogins > 5) {
                await this.createFraudAlert(uid, 'MULTIPLE_FAILED_LOGINS', 'High volume of failed login attempts in 1 hour', 'HIGH');
            }

            // Rule 2: Too many property posts in short time
            const dayAgo = new Date(Date.now() - 86400000);
            const recentPosts = await this.prisma.house.count({
                where: { owner_id: uid, created_at: { gte: dayAgo } }
            });

            if (recentPosts > 10) {
                await this.createFraudAlert(uid, 'RAPID_POSTS', 'User posted more than 10 properties in 24 hours', 'MEDIUM');
            }
        }
    }

    private async createFraudAlert(userId: string, type: string, description: string, severity: string) {
        // Check if alert already exists recently to avoid spam
        const threshold = new Date(Date.now() - 3600000); // 1 hour
        const existing = await this.prisma.fraudAlert.findFirst({
            where: { userId, type, createdAt: { gte: threshold } }
        });

        if (!existing) {
            return this.prisma.fraudAlert.create({
                data: { userId, type, description, severity }
            });
        }
    }

    /**
     * Detect suspicious IP addresses
     */
    async detectSuspiciousIPs() {
        const logs = await this.prisma.loginLog.findMany({
            where: { timestamp: { gte: new Date(Date.now() - 86400000 * 7) } }, // Last 7 days
            select: { ipAddress: true, success: true, userId: true }
        });

        const ipStats = new Map<string, { total: number; failed: number; users: Set<string> }>();

        for (const log of logs) {
            if (!log.ipAddress) continue;
            const stats = ipStats.get(log.ipAddress) || { total: 0, failed: 0, users: new Set() };
            stats.total++;
            if (!log.success) stats.failed++;
            if (log.userId) stats.users.add(log.userId);
            ipStats.set(log.ipAddress, stats);
        }

        for (const [ip, stats] of ipStats.entries()) {
            if (stats.failed > 20 || stats.users.size > 5) {
                const riskLevel = stats.failed > 50 ? 'HIGH' : 'MEDIUM';
                
                // Get Geolocation
                let country = 'Unknown';
                try {
                    const geoRes = await axios.get(`https://ipapi.co/${ip}/json/`);
                    country = geoRes.data.country_name || 'Unknown';
                } catch (e) {
                    this.logger.error(`Failed to geolocate IP ${ip}`, e);
                }

                await this.prisma.suspiciousIP.upsert({
                    where: { ipAddress: ip },
                    update: { 
                        loginAttempts: stats.total, 
                        failedAttempts: stats.failed, 
                        affectedUsers: stats.users.size,
                        riskLevel 
                    },
                    create: { 
                        ipAddress: ip, 
                        country, 
                        loginAttempts: stats.total, 
                        failedAttempts: stats.failed, 
                        affectedUsers: stats.users.size,
                        riskLevel 
                    }
                });
            }
        }
    }

    /**
     * Heatmap aggregation (Hourly/Daily)
     */
    async getTrafficHeatmap() {
        // Last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        const logs = await this.prisma.loginLog.findMany({
            where: { timestamp: { gte: thirtyDaysAgo } },
            select: { timestamp: true }
        });

        // Group by weekday and hour for the weekly heatmap shown in the dashboard
        const heatmap: Record<string, number> = {};

        logs.forEach(log => {
            const hour = log.timestamp.getHours();
            const jsDay = log.timestamp.getDay();
            const day = jsDay === 0 ? 7 : jsDay;
            const key = `${day}:${hour}`;
            heatmap[key] = (heatmap[key] || 0) + 1;
        });

        return Object.entries(heatmap).map(([key, count]) => {
            const [day, hour] = key.split(':');
            return { day: parseInt(day, 10), hour: parseInt(hour, 10), count };
        });
    }
}
