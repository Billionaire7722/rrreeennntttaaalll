import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../security/roles.enum';
import { PresenceService } from '../presence/presence.service';

@Injectable()
export class AdminService {
    constructor(
        private prisma: PrismaService,
        private presenceService: PresenceService
    ) { }

    async getAllUsers(skip = 0, take = 50) {
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where: { role: Role.USER },
                skip: Number(skip),
                take: Number(take),
                select: {
                    id: true,
                    name: true,
                    username: true,
                    email: true,
                    phone: true,
                    status: true,
                    created_at: true,
                    deleted_at: true,
                    role: true
                }
            }),
            this.prisma.user.count({ where: { role: Role.USER } })
        ]);
        return { users, total, skip: Number(skip), take: Number(take) };
    }

    async getAllAdmins(skip = 0, take = 50) {
        const where = {
            role: Role.SUPER_ADMIN,
            deleted_at: null
        };

        const [admins, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip: Number(skip),
                take: Number(take),
                select: {
                    id: true,
                    name: true,
                    username: true,
                    email: true,
                    phone: true,
                    role: true,
                    status: true,
                    created_at: true,
                    deleted_at: true
                }
            }),
            this.prisma.user.count({ where })
        ]);
        return { admins, total, skip: Number(skip), take: Number(take) };
    }

    async updateAdmin(
        adminId: string,
        data: { name?: string; username?: string; email?: string; phone?: string; password?: string }
    ) {
        const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
        if (!admin) throw new NotFoundException('User not found');

        if (admin.role === Role.SUPER_ADMIN) {
            throw new ForbiddenException('Cannot edit SUPER_ADMIN account');
        }

        const payload: any = {};

        if (data.name !== undefined) payload.name = data.name;
        if (data.phone !== undefined) payload.phone = data.phone;

        if (data.username !== undefined && data.username !== admin.username) {
            const usernameTaken = await this.prisma.user.findFirst({
                where: {
                    username: data.username,
                    id: { not: adminId }
                }
            });
            if (usernameTaken) {
                throw new ForbiddenException('Username already exists');
            }
            payload.username = data.username;
        }

        if (data.email !== undefined && data.email !== admin.email) {
            const emailTaken = await this.prisma.user.findFirst({
                where: {
                    email: data.email,
                    id: { not: adminId }
                }
            });
            if (emailTaken) {
                throw new ForbiddenException('Email already exists');
            }
            payload.email = data.email;
        }

        if (data.password && data.password.trim().length > 0) {
            payload.password = await bcrypt.hash(data.password, 10);
        }

        return this.prisma.user.update({
            where: { id: adminId },
            data: payload,
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                phone: true,
                role: true,
                status: true
            }
        });
    }

    async changeMyPassword(userId: string, currentPassword: string, newPassword: string) {
        if (!currentPassword || !newPassword) {
            throw new ForbiddenException('Current password and new password are required');
        }
        if (newPassword.length < 8) {
            throw new ForbiddenException('New password must be at least 8 characters');
        }

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        if (user.role !== Role.SUPER_ADMIN) {
            throw new ForbiddenException('Only SUPER_ADMIN can use this action');
        }

        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) {
            throw new ForbiddenException('Current password is incorrect');
        }

        const sameAsOld = await bcrypt.compare(newPassword, user.password);
        if (sameAsOld) {
            throw new ForbiddenException('New password must be different from current password');
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashed },
        });

        return { message: 'Super-admin password updated successfully' };
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
            this.prisma.user.count({ where: { role: Role.SUPER_ADMIN } }),
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
            data: { role: Role.USER }
        });

        // Add exact credentials
        const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'ceo@rentalapp.com';
        const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
        if (!superAdminPassword) {
            throw new ForbiddenException('SUPER_ADMIN_PASSWORD is required');
        }
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

    async createAdmin(data: { name: string; username: string; email: string; phone?: string; password: string }) {
        const existing = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: data.email },
                    { username: data.username },
                ],
            },
        });

        if (existing) {
            throw new ForbiddenException('Username or email already exists');
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);
        const admin = await this.prisma.user.create({
            data: {
                name: data.name,
                username: data.username,
                email: data.email,
                phone: data.phone,
                password: hashedPassword,
                role: Role.SUPER_ADMIN,
                status: 'ACTIVE',
            },
            select: { id: true, name: true, username: true, email: true, role: true, status: true },
        });

        return admin;
    }

    async createUser(data: { name: string; username: string; email: string; phone?: string; password: string }) {
        const existing = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: data.email },
                    { username: data.username },
                ],
            },
        });

        if (existing) {
            throw new ForbiddenException('Username or email already exists');
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = await this.prisma.user.create({
            data: {
                name: data.name,
                username: data.username,
                email: data.email,
                phone: data.phone,
                password: hashedPassword,
                role: Role.USER,
                status: 'ACTIVE',
            },
            select: { id: true, name: true, username: true, email: true, role: true, status: true },
        });

        return user;
    }

    async getLiveSessions(skip = 0, take = 50, role?: string) {
        const where: any = {
            role: {
                in: [Role.USER, Role.SUPER_ADMIN]
            }
        };
        if (role) {
            where.role = role;
        }

        const [users, total, loginLogs] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip: Number(skip),
                take: Number(take),
                orderBy: { updated_at: 'desc' },
                select: {
                    id: true,
                    name: true,
                    username: true,
                    email: true,
                    role: true,
                    status: true,
                    deleted_at: true,
                }
            }),
            this.prisma.user.count({ where }),
            this.prisma.loginLog.findMany({
                where: {
                    success: true,
                    userId: { not: null }
                },
                orderBy: { timestamp: 'desc' },
                take: 1000,
                select: {
                    userId: true,
                    timestamp: true,
                    ipAddress: true,
                    userAgent: true,
                }
            })
        ]);

        const latestLoginByUser = new Map<string, { timestamp: Date; ipAddress: string | null; userAgent: string | null }>();
        for (const log of loginLogs) {
            if (!log.userId) continue;
            if (!latestLoginByUser.has(log.userId)) {
                latestLoginByUser.set(log.userId, {
                    timestamp: log.timestamp,
                    ipAddress: log.ipAddress,
                    userAgent: log.userAgent,
                });
            }
        }

        const items = users.map((user) => {
            const presence = this.presenceService.getPresence(user.id);
            const latestLogin = latestLoginByUser.get(user.id);
            return {
                id: user.id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role,
                accountStatus: user.status,
                deletedAt: user.deleted_at,
                onlineStatus: presence ? 'ONLINE' : 'OFFLINE',
                lastSeenAt: presence?.lastSeenAt || latestLogin?.timestamp?.toISOString() || null,
                ipAddress: presence?.ipAddress || latestLogin?.ipAddress || null,
                userAgent: presence?.userAgent || latestLogin?.userAgent || null,
            };
        });

        return {
            items,
            total,
            skip: Number(skip),
            take: Number(take),
        };
    }
}
