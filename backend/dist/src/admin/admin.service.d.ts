import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../security/roles.enum';
export declare class AdminService {
    private prisma;
    constructor(prisma: PrismaService);
    getAllUsers(skip?: number, take?: number): Promise<{
        users: {
            id: string;
            name: string;
            status: string;
            created_at: Date;
            deleted_at: Date | null;
            email: string;
            phone: string | null;
            role: import("@prisma/client").$Enums.Role;
        }[];
        total: number;
        skip: number;
        take: number;
    }>;
    getAllAdmins(skip?: number, take?: number): Promise<{
        admins: {
            id: string;
            name: string;
            status: string;
            created_at: Date;
            deleted_at: Date | null;
            email: string;
            phone: string | null;
            role: import("@prisma/client").$Enums.Role;
        }[];
        total: number;
        skip: number;
        take: number;
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
        original_id: string;
        name: string;
        address: string;
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
        image_url_8: string | null;
        description: string | null;
        status: string | null;
        is_private_bathroom: boolean;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
    }>;
    getLoginLogs(skip?: number, take?: number, status?: string): Promise<{
        items: {
            id: string;
            role: string | null;
            userId: string | null;
            ipAddress: string | null;
            userAgent: string | null;
            success: boolean;
            timestamp: Date;
        }[];
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
}
