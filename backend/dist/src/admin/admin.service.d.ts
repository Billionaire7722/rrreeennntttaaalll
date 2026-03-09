import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../security/roles.enum';
import { PresenceService } from '../presence/presence.service';
export declare class AdminService {
    private prisma;
    private presenceService;
    constructor(prisma: PrismaService, presenceService: PresenceService);
    getAllUsers(skip?: number, take?: number, search?: string, status?: string): Promise<{
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
    getAllAdmins(skip?: number, take?: number): Promise<{
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
    updateAdmin(adminId: string, data: {
        name?: string;
        username?: string;
        email?: string;
        phone?: string;
        password?: string;
    }): Promise<{
        id: string;
        name: string;
        username: string;
        email: string;
        phone: string | null;
        role: import("@prisma/client").$Enums.Role;
        status: string;
    }>;
    changeMyPassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    changeRole(adminId: string, newRole: Role): Promise<{
        id: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
    }>;
    changeStatus(adminId: string, status: string): Promise<{
        id: string;
        name: string;
        status: string;
    }>;
    softDeleteAdmin(adminId: string): Promise<{
        id: string;
        name: string;
        deleted_at: Date | null;
    }>;
    restoreUser(userId: string): Promise<{
        id: string;
        name: string;
        deleted_at: Date | null;
    }>;
    restoreHouse(houseId: string): Promise<{
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
    getLoginLogs(skip?: number, take?: number, status?: string): Promise<{
        items: ({
            user: never;
        } & {
            id: string;
            role: string | null;
            userId: string | null;
            ipAddress: string | null;
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
    seedSuperAdmin(): Promise<{
        message: string;
        email: string;
        password_used_in_seed: string;
    }>;
    createAdmin(data: {
        name: string;
        username: string;
        email: string;
        phone?: string;
        password: string;
    }): Promise<{
        id: string;
        name: string;
        username: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        status: string;
    }>;
    createUser(data: {
        name: string;
        username: string;
        email: string;
        phone?: string;
        password: string;
    }): Promise<{
        id: string;
        name: string;
        username: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        status: string;
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
    getUserReports(skip?: number, take?: number): Promise<{
        items: any;
        total: any;
        skip: number;
        take: number;
    }>;
    getPropertyReports(skip?: number, take?: number): Promise<{
        items: any;
        total: any;
        skip: number;
        take: number;
    }>;
    getSupportRequests(skip?: number, take?: number): Promise<{
        items: any;
        total: any;
        skip: number;
        take: number;
    }>;
    updateReportStatus(type: 'user' | 'property', id: string, status: string): Promise<any>;
    updateTicketStatus(id: string, status: string): Promise<any>;
}
