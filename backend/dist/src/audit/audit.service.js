"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AuditService = class AuditService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async logAction(data) {
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
        }
        catch (error) {
            console.error('Failed to write audit log:', error);
        }
    }
    async getLogs(params) {
        const { skip = 0, take = 50, adminId, actionType, startDate, endDate } = params;
        const where = {};
        if (adminId)
            where.actorId = adminId;
        if (actionType)
            where.actionType = actionType;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
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
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
//# sourceMappingURL=audit.service.js.map