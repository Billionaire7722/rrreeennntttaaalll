import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../security/roles.enum';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    async getAllUsers(skip = 0, take = 50) {
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where: { role: Role.USER },
                skip: Number(skip),
                take: Number(take),
                select: {
                    id: true, name: true, email: true, phone: true, status: true, created_at: true, deleted_at: true, role: true
                }
            }),
            this.prisma.user.count({ where: { role: Role.USER } })
        ]);
        return { users, total, skip: Number(skip), take: Number(take) };
    }

    async getAllAdmins(skip = 0, take = 50) {
        const [admins, total] = await Promise.all([
            this.prisma.user.findMany({
                where: { role: { in: [Role.ADMIN, Role.SUPER_ADMIN] } },
                skip: Number(skip),
                take: Number(take),
                select: {
                    id: true, name: true, email: true, phone: true, role: true, status: true, created_at: true, deleted_at: true
                }
            }),
            this.prisma.user.count({ where: { role: { in: [Role.ADMIN, Role.SUPER_ADMIN] } } })
        ]);
        return { admins, total, skip: Number(skip), take: Number(take) };
    }

    async changeRole(adminId: string, newRole: Role) {
        const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
        if (!admin) throw new NotFoundException('User not found');

        // Prevent modifying a SUPER_ADMIN's role
        if (admin.role === Role.SUPER_ADMIN) {
            throw new ForbiddenException('Cannot modify SUPER_ADMIN role');
        }

        return this.prisma.user.update({
            where: { id: adminId },
            data: { role: newRole },
            select: { id: true, name: true, role: true }
        });
    }

    async changeStatus(adminId: string, status: string) {
        const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
        if (!admin) throw new NotFoundException('User not found');

        if (admin.role === Role.SUPER_ADMIN) {
            throw new ForbiddenException('Cannot modify SUPER_ADMIN status');
        }

        return this.prisma.user.update({
            where: { id: adminId },
            data: { status },
            select: { id: true, name: true, status: true }
        });
    }

    async softDeleteAdmin(adminId: string) {
        const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
        if (!admin) throw new NotFoundException('User not found');

        if (admin.role === Role.SUPER_ADMIN) {
            throw new ForbiddenException('Cannot delete SUPER_ADMIN');
        }

        return this.prisma.user.update({
            where: { id: adminId },
            data: { deleted_at: new Date() },
            select: { id: true, name: true, deleted_at: true }
        });
    }

    async restoreUser(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        return this.prisma.user.update({
            where: { id: userId },
            data: { deleted_at: null },
            select: { id: true, name: true, deleted_at: true }
        });
    }

    async restoreHouse(houseId: string) {
        const house = await this.prisma.house.findUnique({ where: { id: houseId } });
        if (!house) throw new NotFoundException('House not found');

        return this.prisma.house.update({
            where: { id: houseId },
            data: { deleted_at: null },
        });
    }

    async getLoginLogs(skip = 0, take = 50, status?: string) {
        const where: any = {};
        if (status === 'failed') {
            where.success = false;
        } else if (status === 'success') {
            where.success = true;
        }

        const [items, total] = await Promise.all([
            this.prisma.loginLog.findMany({
                where,
                skip: Number(skip),
                take: Number(take),
                orderBy: { timestamp: 'desc' }
            }),
            this.prisma.loginLog.count({ where })
        ]);

        return { items, total, skip: Number(skip), take: Number(take) };
    }

    async getSystemMetrics() {
        // Today's boundaries
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // 7 days ago boundary
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const [
            totalUsers,
            totalAdmins,
            totalProperties,
            deletedProperties,
            loginAttemptsToday
        ] = await Promise.all([
            this.prisma.user.count({ where: { role: Role.USER } }),
            this.prisma.user.count({ where: { role: { in: [Role.ADMIN, Role.SUPER_ADMIN] } } }),
            this.prisma.house.count({ where: { deleted_at: null } }),
            this.prisma.house.count({ where: { deleted_at: { not: null } } }),
            this.prisma.loginLog.count({ where: { timestamp: { gte: todayStart } } })
        ]);

        // Fetch last 7 days of login logs
        const recentLogins = await this.prisma.loginLog.findMany({
            where: { timestamp: { gte: sevenDaysAgo } },
            select: { success: true, timestamp: true }
        });

        // Group by day for login charts
        const loginDataMap: Record<string, { logins: number; failed: number }> = {};
        for (let i = 0; i <= 6; i++) {
            const d = new Date(sevenDaysAgo);
            d.setDate(d.getDate() + i);
            loginDataMap[d.toISOString().split('T')[0]] = { logins: 0, failed: 0 };
        }

        for (const log of recentLogins) {
            const dateStr = log.timestamp.toISOString().split('T')[0];
            if (loginDataMap[dateStr]) {
                if (log.success) loginDataMap[dateStr].logins++;
                else loginDataMap[dateStr].failed++;
            }
        }

        const loginData = Object.keys(loginDataMap).map(dateStr => ({
            day: dateStr,
            logins: loginDataMap[dateStr].logins,
            failed: loginDataMap[dateStr].failed
        }));

        // Fetch last 7 days of audit logs for mutative actions
        const recentAudits = await this.prisma.auditLog.findMany({
            where: { createdAt: { gte: sevenDaysAgo } },
            select: { actionType: true, createdAt: true }
        });

        const actionDataMap: Record<string, { creates: number; updates: number; deletes: number }> = {};
        for (let i = 0; i <= 6; i++) {
            const d = new Date(sevenDaysAgo);
            d.setDate(d.getDate() + i);
            actionDataMap[d.toISOString().split('T')[0]] = { creates: 0, updates: 0, deletes: 0 };
        }

        for (const log of recentAudits) {
            const dateStr = log.createdAt.toISOString().split('T')[0];
            if (actionDataMap[dateStr]) {
                const type = log.actionType.toUpperCase();
                if (type.includes('CREATE')) actionDataMap[dateStr].creates++;
                else if (type.includes('DELETE')) actionDataMap[dateStr].deletes++;
                else actionDataMap[dateStr].updates++; // Assuming everything else is an update/patch
            }
        }

        const actionData = Object.keys(actionDataMap).map(dateStr => ({
            day: dateStr,
            creates: actionDataMap[dateStr].creates,
            updates: actionDataMap[dateStr].updates,
            deletes: actionDataMap[dateStr].deletes
        }));

        return {
            overview: {
                totalUsers,
                totalAdmins,
                totalProperties,
                deletedProperties,
                loginAttemptsToday
            },
            charts: {
                loginData,
                actionData
            }
        };
    }

    async seedSuperAdmin() {
        // Demote existing SUPER_ADMINs
        await this.prisma.user.updateMany({
            where: { role: Role.SUPER_ADMIN },
            data: { role: Role.ADMIN }
        });

        // Add exact credentials
        const superAdminEmail = 'ceo@rentalapp.com';
        const superAdminPassword = 'StrictPassword2026!';
        const hashedPassword = await bcrypt.hash(superAdminPassword, 10);

        const superAdmin = await this.prisma.user.upsert({
            where: { email: superAdminEmail },
            update: {
                role: Role.SUPER_ADMIN,
                status: 'ACTIVE',
                deleted_at: null,
                password: hashedPassword
            },
            create: {
                name: 'Master System Administrator',
                username: 'superadmin_ceo',
                email: superAdminEmail,
                password: hashedPassword,
                role: Role.SUPER_ADMIN,
                status: 'ACTIVE',
                phone: '+1-555-0199'
            }
        });

        return {
            message: 'Strict SUPER_ADMIN established',
            email: superAdmin.email,
            password_used_in_seed: superAdminPassword
        };
    }
}
