import { AdminService } from './admin.service';
import { AuditService } from '../audit/audit.service';
import { Role } from '../security/roles.enum';
export declare class AdminController {
    private readonly adminService;
    private readonly auditService;
    constructor(adminService: AdminService, auditService: AuditService);
    getUsers(skip?: number, take?: number, search?: string, status?: string): Promise<{
        users: {
            id: string;
            name: string;
            firstName: string | null;
            lastName: string | null;
            username: string;
            email: string;
            phone: string | null;
            avatarUrl: string | null;
            coverUrl: string | null;
            role: import("@prisma/client").$Enums.Role;
            status: string;
            bio: string | null;
            deleted_at: Date | null;
            created_at: Date;
            _count: {
                ownedHouses: number;
            };
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
    updateAdminInfo(id: string, body: any): Promise<{
        id: string;
        name: string;
        username: string;
        email: string;
        phone: string | null;
        role: import("@prisma/client").$Enums.Role;
        status: string;
    }>;
    changeAdminRole(id: string, role: Role): Promise<{
        id: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
    }>;
    changeAdminStatus(id: string, status: string): Promise<{
        id: string;
        name: string;
        status: string;
    }>;
    deleteAdmin(id: string): Promise<{
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
    getLoginLogs(skip?: number, take?: number, status?: string): Promise<{
        items: ({
            user: never;
        } & {
            id: string;
            role: string | null;
            ipAddress: string | null;
            userAgent: string | null;
            userId: string | null;
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
}
