import { AdminService } from './admin.service';
import { AuditService } from '../audit/audit.service';
import { Role } from '../security/roles.enum';
export declare class AdminController {
    private readonly adminService;
    private readonly auditService;
    constructor(adminService: AdminService, auditService: AuditService);
    getUsers(skip?: number, take?: number, search?: string, status?: string): Promise<{
        users: {
            [x: string]: {
                id: string;
                description: string;
                activityType: string;
                ipAddress: string | null;
                country: string | null;
                createdAt: Date;
                userId: string;
            }[] | ({
                id: string;
                name: string;
                status: string | null;
                deleted_at: Date | null;
                created_at: Date;
                updated_at: Date;
                original_id: string;
                property_type: string | null;
                address: string;
                ward: string | null;
                district: string;
                city: string;
                latitude: number | null;
                longitude: number | null;
                price: number | null;
                payment_method: string | null;
                bedrooms: number | null;
                square: number | null;
                image_url_1: string | null;
                image_url_2: string | null;
                image_url_3: string | null;
                image_url_4: string | null;
                image_url_5: string | null;
                image_url_6: string | null;
                image_url_7: string | null;
                video_url_1: string | null;
                video_url_2: string | null;
                description: string | null;
                is_private_bathroom: boolean;
                contact_phone: string | null;
                owner_id: string | null;
            } | {
                id: string;
                name: string;
                status: string | null;
                deleted_at: Date | null;
                created_at: Date;
                updated_at: Date;
                original_id: string;
                property_type: string | null;
                address: string;
                ward: string | null;
                district: string;
                city: string;
                latitude: number | null;
                longitude: number | null;
                price: number | null;
                payment_method: string | null;
                bedrooms: number | null;
                square: number | null;
                image_url_1: string | null;
                image_url_2: string | null;
                image_url_3: string | null;
                image_url_4: string | null;
                image_url_5: string | null;
                image_url_6: string | null;
                image_url_7: string | null;
                video_url_1: string | null;
                video_url_2: string | null;
                description: string | null;
                is_private_bathroom: boolean;
                contact_phone: string | null;
                owner_id: string | null;
            })[] | ({
                id: string;
                description: string;
                activityType: string;
                ipAddress: string | null;
                country: string | null;
                createdAt: Date;
                userId: string;
            } | {
                id: string;
                description: string;
                activityType: string;
                ipAddress: string | null;
                country: string | null;
                createdAt: Date;
                userId: string;
            })[] | ({
                id: string;
                role: string | null;
                ipAddress: string | null;
                userId: string | null;
                userAgent: string | null;
                success: boolean;
                timestamp: Date;
            } | {
                id: string;
                role: string | null;
                ipAddress: string | null;
                userId: string | null;
                userAgent: string | null;
                success: boolean;
                timestamp: Date;
            })[] | ({
                id: string;
                ipAddress: string | null;
                createdAt: Date;
                userAgent: string | null;
                actorRole: string | null;
                actionType: string;
                entityType: string;
                entityId: string;
                beforeData: import("@prisma/client/runtime/client").JsonValue | null;
                afterData: import("@prisma/client/runtime/client").JsonValue | null;
                actorId: string | null;
            } | {
                id: string;
                ipAddress: string | null;
                createdAt: Date;
                userAgent: string | null;
                actorRole: string | null;
                actionType: string;
                entityType: string;
                entityId: string;
                beforeData: import("@prisma/client/runtime/client").JsonValue | null;
                afterData: import("@prisma/client/runtime/client").JsonValue | null;
                actorId: string | null;
            })[] | ({
                id: string;
                created_at: Date;
                userId: string;
                houseId: string;
            } | {
                id: string;
                created_at: Date;
                userId: string;
                houseId: string;
            })[] | ({
                id: string;
                created_at: Date;
                userId: string;
                senderId: string | null;
                senderRole: import("@prisma/client").$Enums.Role;
                content: string;
                seen_at: Date | null;
                seen_by_role: import("@prisma/client").$Enums.Role | null;
                receiverId: string | null;
                ticketId: string | null;
            } | {
                id: string;
                created_at: Date;
                userId: string;
                senderId: string | null;
                senderRole: import("@prisma/client").$Enums.Role;
                content: string;
                seen_at: Date | null;
                seen_by_role: import("@prisma/client").$Enums.Role | null;
                receiverId: string | null;
                ticketId: string | null;
            })[] | ({
                id: string;
                status: string;
                createdAt: Date;
                reporterId: string;
                targetId: string;
                reason: string;
                details: string | null;
                updatedAt: Date;
            } | {
                id: string;
                status: string;
                createdAt: Date;
                reporterId: string;
                targetId: string;
                reason: string;
                details: string | null;
                updatedAt: Date;
            })[] | ({
                id: string;
                status: string;
                createdAt: Date;
                reporterId: string;
                reason: string;
                details: string | null;
                updatedAt: Date;
                houseId: string;
            } | {
                id: string;
                status: string;
                createdAt: Date;
                reporterId: string;
                reason: string;
                details: string | null;
                updatedAt: Date;
                houseId: string;
            })[] | ({
                id: string;
                status: string;
                createdAt: Date;
                userId: string;
                updatedAt: Date;
                subject: string;
                priority: string;
            } | {
                id: string;
                status: string;
                createdAt: Date;
                userId: string;
                updatedAt: Date;
                subject: string;
                priority: string;
            })[] | ({
                id: string;
                status: string;
                description: string;
                createdAt: Date;
                userId: string | null;
                updatedAt: Date;
                type: string;
                severity: string;
            } | {
                id: string;
                status: string;
                description: string;
                createdAt: Date;
                userId: string | null;
                updatedAt: Date;
                type: string;
                severity: string;
            })[] | ({
                id: string;
                status: string;
                description: string;
                createdAt: Date;
                ownerId: string;
                fraudType: string;
                severity: string;
                propertyId: string;
            } | {
                id: string;
                status: string;
                description: string;
                createdAt: Date;
                ownerId: string;
                fraudType: string;
                severity: string;
                propertyId: string;
            })[] | ({
                id: string;
                created_at: Date;
                description: string;
                country: string | null;
                admin_id: string | null;
                event_type: string;
                ip_address: string | null;
            } | {
                id: string;
                created_at: Date;
                description: string;
                country: string | null;
                admin_id: string | null;
                event_type: string;
                ip_address: string | null;
            })[] | ({
                id: string;
                created_at: Date;
                admin_id: string;
                ip_address: string;
                action: string;
                target_type: string;
                target_id: string;
                user_agent: string | null;
            } | {
                id: string;
                created_at: Date;
                admin_id: string;
                ip_address: string;
                action: string;
                target_type: string;
                target_id: string;
                user_agent: string | null;
            })[] | ({
                id: string;
                ipAddress: string | null;
                createdAt: Date;
                userId: string;
                userAgent: string | null;
                token: string;
                expiresAt: Date;
                revokedAt: Date | null;
            } | {
                id: string;
                ipAddress: string | null;
                createdAt: Date;
                userId: string;
                userAgent: string | null;
                token: string;
                expiresAt: Date;
                revokedAt: Date | null;
            })[] | {
                id: string;
                name: string;
                status: string | null;
                deleted_at: Date | null;
                created_at: Date;
                updated_at: Date;
                original_id: string;
                property_type: string | null;
                address: string;
                ward: string | null;
                district: string;
                city: string;
                latitude: number | null;
                longitude: number | null;
                price: number | null;
                payment_method: string | null;
                bedrooms: number | null;
                square: number | null;
                image_url_1: string | null;
                image_url_2: string | null;
                image_url_3: string | null;
                image_url_4: string | null;
                image_url_5: string | null;
                image_url_6: string | null;
                image_url_7: string | null;
                video_url_1: string | null;
                video_url_2: string | null;
                description: string | null;
                is_private_bathroom: boolean;
                contact_phone: string | null;
                owner_id: string | null;
            }[] | {
                id: string;
                role: string | null;
                ipAddress: string | null;
                userId: string | null;
                userAgent: string | null;
                success: boolean;
                timestamp: Date;
            }[] | {
                id: string;
                ipAddress: string | null;
                createdAt: Date;
                userAgent: string | null;
                actorRole: string | null;
                actionType: string;
                entityType: string;
                entityId: string;
                beforeData: import("@prisma/client/runtime/client").JsonValue | null;
                afterData: import("@prisma/client/runtime/client").JsonValue | null;
                actorId: string | null;
            }[] | {
                id: string;
                created_at: Date;
                userId: string;
                houseId: string;
            }[] | {
                id: string;
                created_at: Date;
                userId: string;
                senderId: string | null;
                senderRole: import("@prisma/client").$Enums.Role;
                content: string;
                seen_at: Date | null;
                seen_by_role: import("@prisma/client").$Enums.Role | null;
                receiverId: string | null;
                ticketId: string | null;
            }[] | {
                id: string;
                status: string;
                createdAt: Date;
                reporterId: string;
                targetId: string;
                reason: string;
                details: string | null;
                updatedAt: Date;
            }[] | {
                id: string;
                status: string;
                createdAt: Date;
                reporterId: string;
                reason: string;
                details: string | null;
                updatedAt: Date;
                houseId: string;
            }[] | {
                id: string;
                status: string;
                createdAt: Date;
                userId: string;
                updatedAt: Date;
                subject: string;
                priority: string;
            }[] | {
                id: string;
                status: string;
                description: string;
                createdAt: Date;
                userId: string | null;
                updatedAt: Date;
                type: string;
                severity: string;
            }[] | {
                id: string;
                status: string;
                description: string;
                createdAt: Date;
                ownerId: string;
                fraudType: string;
                severity: string;
                propertyId: string;
            }[] | {
                id: string;
                created_at: Date;
                description: string;
                country: string | null;
                admin_id: string | null;
                event_type: string;
                ip_address: string | null;
            }[] | {
                id: string;
                created_at: Date;
                admin_id: string;
                ip_address: string;
                action: string;
                target_type: string;
                target_id: string;
                user_agent: string | null;
            }[] | {
                id: string;
                ipAddress: string | null;
                createdAt: Date;
                userId: string;
                userAgent: string | null;
                token: string;
                expiresAt: Date;
                revokedAt: Date | null;
            }[];
            [x: number]: never;
            [x: symbol]: never;
        }[];
        total: number;
        skip: number;
        take: number;
    }>;
    getAdmins(skip?: number, take?: number): Promise<{
        admins: {
            id: string;
            name: string;
            username: string;
            email: string;
            phone: string | null;
            role: import("@prisma/client").$Enums.Role;
            status: string;
            deleted_at: Date | null;
            created_at: Date;
        }[];
        total: number;
        skip: number;
        take: number;
    }>;
    changeMyPassword(req: any, body: {
        currentPassword: string;
        newPassword: string;
    }): Promise<{
        message: string;
    }>;
    createAdmin(body: any): Promise<{
        id: string;
        name: string;
        username: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        status: string;
    }>;
    createUser(body: any): Promise<{
        id: string;
        name: string;
        username: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        status: string;
    }>;
    updateUser(id: string, body: any, req: any): Promise<{
        id: string;
        name: string;
        username: string;
        email: string;
        phone: string | null;
        role: import("@prisma/client").$Enums.Role;
        status: string;
    }>;
    updateUserStatus(id: string, body: {
        status: string;
        durationDays?: number;
    }, req: any): Promise<{
        id: string;
        name: string;
        username: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        status: string;
    }>;
    deleteUser(id: string, req: any): Promise<{
        id: string;
        name: string;
        deleted_at: Date | null;
    }>;
    updateAdminInfo(id: string, body: any): Promise<{
        id: string;
        name: string;
        username: string;
        email: string;
        phone: string | null;
        role: import("@prisma/client").$Enums.Role;
        status: string;
    }>;
    changeAdminRole(id: string, role: Role, req: any): Promise<{
        id: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
    }>;
    changeAdminStatus(id: string, status: string, req: any): Promise<{
        id: string;
        name: string;
        status: string;
    }>;
    deleteAdmin(id: string, req: any): Promise<{
        id: string;
        name: string;
        deleted_at: Date | null;
    }>;
    restoreUser(id: string): Promise<{
        id: string;
        name: string;
        deleted_at: Date | null;
    }>;
    restoreHouse(id: string): Promise<{
        id: string;
        name: string;
        status: string | null;
        deleted_at: Date | null;
        created_at: Date;
        updated_at: Date;
        original_id: string;
        property_type: string | null;
        address: string;
        ward: string | null;
        district: string;
        city: string;
        latitude: number | null;
        longitude: number | null;
        price: number | null;
        payment_method: string | null;
        bedrooms: number | null;
        square: number | null;
        image_url_1: string | null;
        image_url_2: string | null;
        image_url_3: string | null;
        image_url_4: string | null;
        image_url_5: string | null;
        image_url_6: string | null;
        image_url_7: string | null;
        video_url_1: string | null;
        video_url_2: string | null;
        description: string | null;
        is_private_bathroom: boolean;
        contact_phone: string | null;
        owner_id: string | null;
    }>;
    getAuditLogs(skip?: number, take?: number, adminId?: string, actionType?: string): Promise<{
        items: ({
            actor: {
                id: string;
                name: string;
                email: string;
            } | null;
        } & {
            id: string;
            ipAddress: string | null;
            createdAt: Date;
            userAgent: string | null;
            actorRole: string | null;
            actionType: string;
            entityType: string;
            entityId: string;
            beforeData: import("@prisma/client/runtime/client").JsonValue | null;
            afterData: import("@prisma/client/runtime/client").JsonValue | null;
            actorId: string | null;
        })[];
        total: number;
        skip: number;
        take: number;
    }>;
    getLoginLogs(skip?: number, take?: number, status?: string): Promise<{
        items: ({
            user: {
                id: string;
                name: string;
                email: string;
                role: import("@prisma/client").$Enums.Role;
            } | null;
        } & {
            id: string;
            role: string | null;
            ipAddress: string | null;
            userId: string | null;
            userAgent: string | null;
            success: boolean;
            timestamp: Date;
        })[];
        total: number;
        skip: number;
        take: number;
    }>;
    getSystemMetrics(): Promise<{
        overview: {
            totalUsers: number;
            totalAdmins: number;
            totalProperties: number;
            deletedProperties: number;
            loginAttemptsToday: number;
            openReports: number;
        };
        charts: {
            loginData: {
                day: string;
                logins: number;
                failed: number;
            }[];
            actionData: {
                day: string;
                creates: number;
                updates: number;
                deletes: number;
            }[];
        };
    }>;
    getLiveSessions(skip?: number, take?: number, role?: string): Promise<{
        items: {
            id: string;
            name: string;
            username: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
            accountStatus: string;
            deletedAt: Date | null;
            onlineStatus: string;
            lastSeenAt: string | null;
            ipAddress: string | null;
            userAgent: string | null;
        }[];
        total: number;
        skip: number;
        take: number;
    }>;
    getUserGrowth(range: string): Promise<{
        date: string;
        count: number;
    }[]>;
    getPropertyActivity(range: string): Promise<{
        created: number;
        deleted: number;
        date: string;
    }[]>;
    getLoginTraffic(range: string): Promise<{
        success: number;
        failed: number;
        date: string;
    }[]>;
    getIPDistribution(): Promise<{
        country: string;
        count: number;
        percentage: number;
    }[]>;
    warnUser(id: string, reason: string, req: any): Promise<{
        message: string;
        reason: string;
    }>;
    restrictAccount(id: string, durationDays: number | undefined, req: any): Promise<{
        id: string;
        name: string;
        firstName: string | null;
        lastName: string | null;
        username: string;
        email: string;
        phone: string | null;
        password: string;
        avatarUrl: string | null;
        coverUrl: string | null;
        role: import("@prisma/client").$Enums.Role;
        status: string;
        name_updated_at: Date | null;
        bio: string | null;
        deleted_at: Date | null;
        created_at: Date;
        updated_at: Date;
        failed_attempts: number;
        last_failed_attempt: Date | null;
        locked_until: Date | null;
    }>;
    deleteHouse(id: string, req: any): Promise<{
        id: string;
        name: string;
        status: string | null;
        deleted_at: Date | null;
        created_at: Date;
        updated_at: Date;
        original_id: string;
        property_type: string | null;
        address: string;
        ward: string | null;
        district: string;
        city: string;
        latitude: number | null;
        longitude: number | null;
        price: number | null;
        payment_method: string | null;
        bedrooms: number | null;
        square: number | null;
        image_url_1: string | null;
        image_url_2: string | null;
        image_url_3: string | null;
        image_url_4: string | null;
        image_url_5: string | null;
        image_url_6: string | null;
        image_url_7: string | null;
        video_url_1: string | null;
        video_url_2: string | null;
        description: string | null;
        is_private_bathroom: boolean;
        contact_phone: string | null;
        owner_id: string | null;
    }>;
    replyTicket(id: string, req: any, content: string): Promise<{
        id: string;
        created_at: Date;
        userId: string;
        senderId: string | null;
        senderRole: import("@prisma/client").$Enums.Role;
        content: string;
        seen_at: Date | null;
        seen_by_role: import("@prisma/client").$Enums.Role | null;
        receiverId: string | null;
        ticketId: string | null;
    }>;
    getUserReports(skip?: number, take?: number): Promise<{
        items: ({
            reporter: {
                id: string;
                name: string;
                email: string;
            };
            target: {
                id: string;
                name: string;
                email: string;
                status: string;
            };
        } & {
            id: string;
            status: string;
            createdAt: Date;
            reporterId: string;
            targetId: string;
            reason: string;
            details: string | null;
            updatedAt: Date;
        })[];
        total: number;
        skip: number;
        take: number;
    }>;
    getPropertyReports(skip?: number, take?: number): Promise<{
        items: ({
            house: {
                id: string;
                name: string;
                status: string | null;
                address: string;
            };
            reporter: {
                id: string;
                name: string;
                email: string;
            };
        } & {
            id: string;
            status: string;
            createdAt: Date;
            reporterId: string;
            reason: string;
            details: string | null;
            updatedAt: Date;
            houseId: string;
        })[];
        total: number;
        skip: number;
        take: number;
    }>;
    getSupportRequests(skip?: number, take?: number): Promise<{
        items: ({
            user: {
                id: string;
                name: string;
                email: string;
                role: import("@prisma/client").$Enums.Role;
            };
            _count: {
                messages: number;
            };
        } & {
            id: string;
            status: string;
            createdAt: Date;
            userId: string;
            updatedAt: Date;
            subject: string;
            priority: string;
        })[];
        total: number;
        skip: number;
        take: number;
    }>;
    updateReportStatus(type: 'user' | 'property', id: string, status: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        reporterId: string;
        targetId: string;
        reason: string;
        details: string | null;
        updatedAt: Date;
    } | {
        id: string;
        status: string;
        createdAt: Date;
        reporterId: string;
        reason: string;
        details: string | null;
        updatedAt: Date;
        houseId: string;
    }>;
    updateTicketStatus(id: string, status: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        subject: string;
        priority: string;
    }>;
}
