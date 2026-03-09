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
export declare class AuditService {
    private prisma;
    constructor(prisma: PrismaService);
    logAction(data: CreateAuditLogDto): Promise<void>;
    getLogs(params: {
        skip?: number;
        take?: number;
        adminId?: string;
        actionType?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<{
        items: ({
            actor: never;
        } & {
            id: string;
            actorId: string | null;
            actorRole: string | null;
            actionType: string;
            entityType: string;
            entityId: string;
            beforeData: import("@prisma/client/runtime/client").JsonValue | null;
            afterData: import("@prisma/client/runtime/client").JsonValue | null;
            ipAddress: string | null;
            userAgent: string | null;
            createdAt: Date;
        })[];
        total: number;
        skip: number;
        take: number;
    }>;
}
