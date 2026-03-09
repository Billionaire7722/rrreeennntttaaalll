import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateAuditLogDto {
    actorId?: string;
    actorRole?: string;
    actionType: string;
    entityType: string;
    entityId: string;
    beforeData?: any;
    afterData?: any;
    ipAddress?: string;
    userAgent?: string;
}

@Injectable()
export class AuditService {
    constructor(private prisma: PrismaService) { }

    async logAction(data: CreateAuditLogDto) {
        try {
            await this.prisma.auditLog.create({
                data: {
                    actorId: data.actorId,
                    actorRole: data.actorRole,
                    actionType: data.actionType,
                    entityType: data.entityType,
                    entityId: data.entityId,
                    beforeData: data.beforeData ?? undefined,
                    afterData: data.afterData ?? undefined,
                    ipAddress: data.ipAddress,
                    userAgent: data.userAgent,
                }
            });
        } catch (error) {
            console.error('Failed to write audit log:', error);
        }
    }

    async getLogs(params: {
        skip?: number;
        take?: number;
        adminId?: string;
        actionType?: string;
        startDate?: string;
        endDate?: string;
    }) {
        const { skip = 0, take = 50, adminId, actionType, startDate, endDate } = params;

        const where: any = {};
        if (adminId) where.actorId = adminId;
        if (actionType) where.actionType = actionType;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const [items, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                skip: Number(skip),
                take: Number(take),
                orderBy: { createdAt: 'desc' },
                include: {
                    actor: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            }),
            this.prisma.auditLog.count({ where })
        ]);

        return { items, total, skip: Number(skip), take: Number(take) };
    }
}
