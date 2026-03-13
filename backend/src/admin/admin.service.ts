import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { parseTimeFilter, TimeFilter } from './analytics.utils';
import { Role } from '../security/roles.enum';
import { PresenceService } from '../presence/presence.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AdminService {
    constructor(
        private prisma: PrismaService,
        private presenceService: PresenceService,
        private auditService: AuditService
    ) { }

    private async logAdminAction(adminId: string, action: string, targetType: string, targetId: string) {
        // Record to the specific AdminAuditLog table as requested
        try {
            await (this.prisma as any).adminAuditLog.create({
                data: {
                    admin_id: adminId,
                    action,
                    target_type: targetType,
                    target_id: targetId,
                    ip_address: 'request_metatada', // In a full implementation, we'd pass this from the controller
                    user_agent: 'request_metatada'
                }
            });
        } catch (e) {
            console.error('Failed to log admin action:', e);
        }
    }

    async getAllUsers(skip = 0, take = 50, search?: string, status?: string) {
        const where: any = { role: Role.USER };

        // By default, hide soft-deleted records unless explicitly requested.
        if (status === 'deleted') {
            where.deleted_at = { not: null };
        } else {
            where.deleted_at = null;
        }
        
        if (status && status !== 'deleted') {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { username: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip: Number(skip),
                take: Number(take),
                orderBy: { created_at: 'desc' },
                select: {
                    id: true,
                    name: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    email: true,
                    phone: true,
                    status: true,
                    created_at: true,
                    deleted_at: true,
                    role: true,
                    avatarUrl: true,
                    coverUrl: true,
                    bio: true,
                    riskScore: {
                        select: { score: true, factors: true, updatedAt: true }
                    },
                    _count: {
                        select: { ownedHouses: true }
                    }
                } as any
            }),
            this.prisma.user.count({ where })
        ]);
        return { users, total, skip: Number(skip), take: Number(take) };
    }

    async updateUser(
        userId: string,
        data: { name?: string; username?: string; email?: string; phone?: string; password?: string },
        actorId: string,
    ) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        if (user.role === Role.SUPER_ADMIN) throw new ForbiddenException('Cannot edit SUPER_ADMIN');

        const payload: any = {};
        if (data.name !== undefined) payload.name = data.name;
        if (data.phone !== undefined) payload.phone = data.phone;

        if (data.username !== undefined && data.username !== user.username) {
            const usernameTaken = await this.prisma.user.findFirst({
                where: { username: data.username, id: { not: userId } },
            });
            if (usernameTaken) throw new ForbiddenException('Username already exists');
            payload.username = data.username;
        }

        if (data.email !== undefined && data.email !== user.email) {
            const emailTaken = await this.prisma.user.findFirst({
                where: { email: data.email, id: { not: userId } },
            });
            if (emailTaken) throw new ForbiddenException('Email already exists');
            payload.email = data.email;
        }

        if (data.password && data.password.trim().length > 0) {
            payload.password = await bcrypt.hash(data.password, 10);
        }

        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: payload,
            select: { id: true, name: true, username: true, email: true, phone: true, role: true, status: true },
        });

        await this.logAdminAction(actorId, 'UPDATE_USER', 'USER', userId);
        return updated;
    }

    async updateUserStatus(userId: string, status: string, actorId: string, durationDays?: number) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        if (user.role === Role.SUPER_ADMIN) throw new ForbiddenException('Cannot modify SUPER_ADMIN');

        const normalized = String(status || '').toUpperCase();
        if (!['ACTIVE', 'LOCKED'].includes(normalized)) {
            throw new BadRequestException('Invalid status. Allowed: ACTIVE, LOCKED');
        }

        let lockedUntil: Date | null = null;
        if (normalized === 'LOCKED') {
            lockedUntil = new Date();
            if (durationDays && Number(durationDays) > 0) {
                lockedUntil.setDate(lockedUntil.getDate() + Number(durationDays));
            } else {
                lockedUntil = new Date('9999-12-31');
            }
        }

        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                status: normalized,
                locked_until: normalized === 'LOCKED' ? lockedUntil : null,
            } as any,
            select: { id: true, name: true, username: true, email: true, role: true, status: true },
        });

        await this.logAdminAction(actorId, normalized === 'LOCKED' ? 'LOCK_USER' : 'UNLOCK_USER', 'USER', userId);
        return updated;
    }

    async softDeleteUser(userId: string, actorId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        if (user.role === Role.SUPER_ADMIN) throw new ForbiddenException('Cannot delete SUPER_ADMIN');

        const result = await this.prisma.user.update({
            where: { id: userId },
            data: { deleted_at: new Date() },
            select: { id: true, name: true, deleted_at: true },
        });

        await this.logAdminAction(actorId, 'DELETE_USER', 'USER', userId);
        return result;
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

    async changeRole(adminId: string, newRole: Role, actorId: string) {
        const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
        if (!admin) throw new NotFoundException('User not found');

        if (admin.role === Role.SUPER_ADMIN) {
            throw new ForbiddenException('Cannot modify SUPER_ADMIN role');
        }

        const updated = await this.prisma.user.update({
            where: { id: adminId },
            data: { role: newRole },
            select: { id: true, name: true, role: true }
        });

        await this.logAdminAction(actorId, 'CHANGE_ROLE', 'USER', adminId);
        return updated;
    }

    async changeStatus(adminId: string, status: string, actorId: string) {
        const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
        if (!admin) throw new NotFoundException('User not found');

        if (admin.role === Role.SUPER_ADMIN) {
            throw new ForbiddenException('Cannot modify SUPER_ADMIN status');
        }

        const updated = await this.prisma.user.update({
            where: { id: adminId },
            data: { status },
            select: { id: true, name: true, status: true }
        });

        await this.logAdminAction(actorId, 'CHANGE_STATUS', 'USER', adminId);
        return updated;
    }

    async softDeleteAdmin(adminId: string, actorId: string) {
        const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
        if (!admin) throw new NotFoundException('User not found');

        if (admin.role === Role.SUPER_ADMIN) {
            throw new ForbiddenException('Cannot delete SUPER_ADMIN');
        }

        const result = await this.prisma.user.update({
            where: { id: adminId },
            data: { deleted_at: new Date() },
            select: { id: true, name: true, deleted_at: true }
        });

        await this.logAdminAction(actorId, 'DELETE_ADMIN', 'USER', adminId);
        return result;
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
            this.prisma.loginLog. findMany({
                where,
                skip: Number(skip),
                take: Number(take),
                orderBy: { timestamp: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                        }
                    }
                }
            }),
            this.prisma.loginLog.count({ where })
        ]);

        return { items, total, skip: Number(skip), take: Number(take) };
    }

    async getSystemMetrics() {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const [
            totalUsers,
            totalAdmins,
            totalProperties,
            deletedProperties,
            loginAttemptsToday,
            openReports,
        ] = await Promise.all([
            this.prisma.user.count({ where: { role: Role.USER } }),
            this.prisma.user.count({ where: { role: Role.SUPER_ADMIN } }),
            this.prisma.house.count({ where: { deleted_at: null } }),
            this.prisma.house.count({ where: { deleted_at: { not: null } } }),
            this.prisma.loginLog.count({ where: { timestamp: { gte: todayStart } } }),
            this.prisma.userReport.count({ where: { status: 'PENDING' } }).then(c => 
                this.prisma.propertyReport.count({ where: { status: 'PENDING' } }).then(c2 => c + c2)
            ),
        ]);

        const recentLogins = await this.prisma.loginLog.findMany({
            where: { timestamp: { gte: sevenDaysAgo } },
            select: { success: true, timestamp: true }
        });

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
                else actionDataMap[dateStr].updates++;
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
                loginAttemptsToday,
                openReports,
            },
            charts: {
                loginData,
                actionData
            }
        };
    }

    async seedSuperAdmin() {
        await this.prisma.user.updateMany({
            where: { role: Role.SUPER_ADMIN },
            data: { role: Role.USER }
        });

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

    async getUserReports(skip = 0, take = 50) {
        const [items, total] = await Promise.all([
            this.prisma.userReport.findMany({
                skip: Number(skip),
                take: Number(take),
                orderBy: { createdAt: 'desc' },
                include: {
                    reporter: { select: { id: true, name: true, email: true } },
                    target: { select: { id: true, name: true, email: true, status: true } },
                }
            }),
            this.prisma.userReport.count()
        ]);
        return { items, total, skip: Number(skip), take: Number(take) };
    }

    async getPropertyReports(skip = 0, take = 50) {
        const [items, total] = await Promise.all([
            this.prisma.propertyReport.findMany({
                skip: Number(skip),
                take: Number(take),
                orderBy: { createdAt: 'desc' },
                include: {
                    reporter: { select: { id: true, name: true, email: true } },
                    house: { select: { id: true, name: true, status: true, address: true } },
                }
            }),
            this.prisma.propertyReport.count()
        ]);
        return { items, total, skip: Number(skip), take: Number(take) };
    }

    async getSupportRequests(skip = 0, take = 50) {
        const [tickets, total] = await Promise.all([
            this.prisma.supportTicket.findMany({
                skip: Number(skip),
                take: Number(take),
                orderBy: { updatedAt: 'desc' },
                include: {
                    user: { select: { id: true, name: true, email: true, role: true } },
                    messages: {
                        orderBy: { created_at: 'asc' },
                        take: 1,
                        select: { content: true }
                    },
                    _count: { select: { messages: true } }
                }
            }),
            this.prisma.supportTicket.count()
        ]);

        const items = tickets.map(t => ({
            ...t,
            message: t.messages[0]?.content || ''
        }));

        return { items, total, skip: Number(skip), take: Number(take) };
    }

    async updateReportStatus(type: 'user' | 'property', id: string, status: string) {
        if (type === 'user') {
            return this.prisma.userReport.update({ where: { id }, data: { status } });
        }
        return this.prisma.propertyReport.update({ where: { id }, data: { status } });
    }

    async updateTicketStatus(id: string, status: string) {
        return this.prisma.supportTicket.update({ where: { id }, data: { status } });
    }

    async warnUser(userId: string, reason: string, actorId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        // Log warning in generic audit log
        await this.auditService.logAction({
            actorId,
            actorRole: Role.SUPER_ADMIN,
            actionType: 'WARN_USER',
            entityType: 'USER',
            entityId: userId,
            afterData: { reason },
        });

        // Log in new admin audit log
        await this.logAdminAction(actorId, 'WARN_USER', 'USER', userId);

        return { message: `User ${user.email} warned successfully`, reason };
    }

    async restrictAccount(userId: string, actorId: string, durationDays?: number) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        if (user.role === Role.SUPER_ADMIN) throw new ForbiddenException('Cannot restrict SUPER_ADMIN');

        let lockedUntil: Date | null = null;
        if (durationDays) {
            lockedUntil = new Date();
            lockedUntil.setDate(lockedUntil.getDate() + durationDays);
        } else {
            lockedUntil = new Date('9999-12-31');
        }

        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { 
                status: 'LOCKED',
                locked_until: lockedUntil
            }
        });

        await this.logAdminAction(actorId, 'RESTRICT_ACCOUNT', 'USER', userId);

        return updated;
    }

    async deleteProperty(propertyId: string, actorId: string) {
        const house = await this.prisma.house.findUnique({ where: { id: propertyId } });
        if (!house) throw new NotFoundException('Property not found');

        const updated = await this.prisma.house.update({
            where: { id: propertyId },
            data: { deleted_at: new Date() }
        });

        await this.logAdminAction(actorId, 'DELETE_PROPERTY', 'PROPERTY', propertyId);

        return updated;
    }

    async replyToTicket(ticketId: string, adminId: string, content: string) {
        const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
        if (!ticket) throw new NotFoundException('Ticket not found');

        const message = await this.prisma.message.create({
            data: {
                userId: adminId,
                ticketId: ticketId,
                content,
                senderRole: Role.SUPER_ADMIN,
            }
        });

        await this.prisma.supportTicket.update({
            where: { id: ticketId },
            data: { updatedAt: new Date() }
        });

        return message;
    }

    private getDateRange(range: string) {
        const now = new Date();
        let startDate = new Date();

        switch (range) {
            case '7d': startDate.setDate(now.getDate() - 7); break;
            case '30d': startDate.setDate(now.getDate() - 30); break;
            case 'this_month': startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
            case 'last_month': startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1); break;
            case 'this_year': startDate = new Date(now.getFullYear(), 0, 1); break;
            default: startDate.setDate(now.getDate() - 30); // Default 30d
        }

        return { gte: startDate };
    }

    async getUserGrowth(range: string) {
        const where = { created_at: this.getDateRange(range) };
        const users = await this.prisma.user.findMany({
            where,
            select: { created_at: true },
            orderBy: { created_at: 'asc' }
        });

        // Group by day for simple visualization
        const growth: Record<string, number> = {};
        users.forEach(u => {
            const date = u.created_at.toISOString().split('T')[0];
            growth[date] = (growth[date] || 0) + 1;
        });

        return Object.entries(growth).map(([date, count]) => ({ date, count }));
    }

    async getPropertyActivity(range: string) {
        const dateFilter = this.getDateRange(range);
        const [created, deleted] = await Promise.all([
            this.prisma.house.findMany({
                where: { created_at: dateFilter },
                select: { created_at: true }
            }),
            this.prisma.house.findMany({
                where: { deleted_at: dateFilter },
                select: { deleted_at: true }
            })
        ]);

        const activity: Record<string, { created: number; deleted: number }> = {};
        created.forEach(h => {
            const date = h.created_at.toISOString().split('T')[0];
            if (!activity[date]) activity[date] = { created: 0, deleted: 0 };
            activity[date].created++;
        });
        deleted.forEach(h => {
            const date = h.deleted_at!.toISOString().split('T')[0];
            if (!activity[date]) activity[date] = { created: 0, deleted: 0 };
            activity[date].deleted++;
        });

        return Object.entries(activity).map(([date, data]) => ({ date, ...data }));
    }

    async getLoginTraffic(range: string) {
        const where = { timestamp: this.getDateRange(range) };
        const logs = await this.prisma.loginLog.findMany({
            where,
            select: { timestamp: true, success: true },
            orderBy: { timestamp: 'asc' }
        });

        const traffic: Record<string, { success: number; failed: number }> = {};
        logs.forEach(l => {
            const date = l.timestamp.toISOString().split('T')[0];
            if (!traffic[date]) traffic[date] = { success: 0, failed: 0 };
            if (l.success) traffic[date].success++;
            else traffic[date].failed++;
        });

        return Object.entries(traffic).map(([date, data]) => ({ date, ...data }));
    }

    async getIPDistribution() {
        // Get last 1000 logs to analyze distribution
        const logs = await this.prisma.loginLog.findMany({
            take: 1000,
            orderBy: { timestamp: 'desc' },
            select: { ipAddress: true }
        });

        const dist: Record<string, number> = {};
        let total = 0;
        logs.forEach(l => {
            if (l.ipAddress) {
                // For now, we'll just group by IP. 
                // In a real app we'd use a GeoIP library to get country.
                // We'll mock "Country" as "IP Range" for now or use a placeholder if we find a lightweight way to map.
                const country = this.mockGeoIP(l.ipAddress);
                dist[country] = (dist[country] || 0) + 1;
                total++;
            }
        });

        return Object.entries(dist)
            .map(([country, count]) => ({
                country,
                count,
                percentage: total > 0 ? Math.round((count / total) * 100) : 0
            }))
            .sort((a, b) => b.count - a.count);
    }

    /**
     * Returns KPI summary metrics for the dashboard.
     * Supports time filtering and comparison modes (previous period, previous year).
     */
    private async countInRange(table: string, column: string, from: Date, to: Date) {
        const result = await this.prisma.$queryRaw<Array<{ count: bigint }>>(
            Prisma.sql`
                SELECT count(*) as count
                FROM ${Prisma.raw(`"${table}"`)}
                WHERE ${Prisma.raw(`"${column}"`)} >= ${from}
                  AND ${Prisma.raw(`"${column}"`)} < ${to}
            `
        );
        return Number(result[0]?.count ?? 0);
    }

    private async seriesByPeriod(table: string, column: string, filter: { from: Date; to: Date; groupBy: string }) {
        const groupBy = filter.groupBy;
        const truncExpr = `date_trunc('${groupBy}', "${column}")`;
        const rows = await this.prisma.$queryRaw<Array<{ period: Date; count: bigint }>>(
            Prisma.sql`
                SELECT ${Prisma.raw(truncExpr)} AS period, count(*) AS count
                FROM ${Prisma.raw(`"${table}"`)}
                WHERE ${Prisma.raw(`"${column}"`)} >= ${filter.from}
                  AND ${Prisma.raw(`"${column}"`)} < ${filter.to}
                GROUP BY period
                ORDER BY period
            `
        );
        return rows.map(r => ({ time: r.period.toISOString(), value: Number(r.count) }));
    }

    async getKpis(filterOpts: { range?: string; from?: string; to?: string; groupBy?: string; compare?: string }) {
        const filter = parseTimeFilter(filterOpts);

        const previousRange = this.getComparisonRange(filter);

        const currentNewUsers = await this.countInRange('User', 'created_at', filter.from, filter.to);
        const previousNewUsers = previousRange ? await this.countInRange('User', 'created_at', previousRange.from, previousRange.to) : null;

        const currentNewHouses = await this.countInRange('House', 'created_at', filter.from, filter.to);
        const previousNewHouses = previousRange ? await this.countInRange('House', 'created_at', previousRange.from, previousRange.to) : null;

        const currentFavorites = await this.countInRange('Favorite', 'created_at', filter.from, filter.to);
        const previousFavorites = previousRange ? await this.countInRange('Favorite', 'created_at', previousRange.from, previousRange.to) : null;

        const currentMessages = await this.countInRange('Message', 'created_at', filter.from, filter.to);
        const previousMessages = previousRange ? await this.countInRange('Message', 'created_at', previousRange.from, previousRange.to) : null;

        const currentLoginAttempts = await this.countInRange('LoginLog', 'timestamp', filter.from, filter.to);
        const previousLoginAttempts = previousRange ? await this.countInRange('LoginLog', 'timestamp', previousRange.from, previousRange.to) : null;

        const totalUsers = await this.prisma.user.count({ where: { role: Role.USER } });
        const totalListings = await this.prisma.house.count({ where: { deleted_at: null } });

        const makeChange = (current: number, previous: number | null) => {
            if (previous === null || previous === 0) return null;
            return Math.round(((current - previous) / previous) * 100);
        };

        return {
            totalUsers: {
                value: totalUsers,
                changePct: makeChange(currentNewUsers, previousNewUsers),
                periodCount: currentNewUsers,
                comparison: previousNewUsers,
                sparkline: await this.seriesByPeriod('User', 'created_at', filter)
            },
            newUsers: {
                value: currentNewUsers,
                changePct: makeChange(currentNewUsers, previousNewUsers),
                comparison: previousNewUsers,
                sparkline: await this.seriesByPeriod('User', 'created_at', filter)
            },
            totalListings: {
                value: totalListings,
                changePct: makeChange(currentNewHouses, previousNewHouses),
                periodCount: currentNewHouses,
                comparison: previousNewHouses,
                sparkline: await this.seriesByPeriod('House', 'created_at', filter)
            },
            newListings: {
                value: currentNewHouses,
                changePct: makeChange(currentNewHouses, previousNewHouses),
                comparison: previousNewHouses,
                sparkline: await this.seriesByPeriod('House', 'created_at', filter)
            },
            favoritesAdded: {
                value: currentFavorites,
                changePct: makeChange(currentFavorites, previousFavorites),
                comparison: previousFavorites,
                sparkline: await this.seriesByPeriod('Favorite', 'created_at', filter)
            },
            messagesSent: {
                value: currentMessages,
                changePct: makeChange(currentMessages, previousMessages),
                comparison: previousMessages,
                sparkline: await this.seriesByPeriod('Message', 'created_at', filter)
            },
            loginAttempts: {
                value: currentLoginAttempts,
                changePct: makeChange(currentLoginAttempts, previousLoginAttempts),
                comparison: previousLoginAttempts,
                sparkline: await this.seriesByPeriod('LoginLog', 'timestamp', filter)
            }
        };
    }

    async getPlatformActivity(filterOpts: { range?: string; from?: string; to?: string; groupBy?: string; compare?: string }) {
        const filter = parseTimeFilter(filterOpts);

        return {
            userGrowth: await this.seriesByPeriod('User', 'created_at', filter),
            listingGrowth: await this.seriesByPeriod('House', 'created_at', filter),
            favoritesTrend: await this.seriesByPeriod('Favorite', 'created_at', filter),
            messagesActivity: await this.seriesByPeriod('Message', 'created_at', filter),
        };
    }

    async getUserEngagement(filterOpts: { range?: string; from?: string; to?: string }) {
        const filter = parseTimeFilter({ ...filterOpts, groupBy: 'day', compare: 'none' });

        // Rank users by activity score: houses*5 + favorites*2 + messages*1
        const rows = await this.prisma.$queryRaw<Array<{
            userId: string;
            name: string;
            email: string;
            houses: bigint;
            favorites: bigint;
            messages: bigint;
            score: number;
        }>>(
            Prisma.sql`
                SELECT
                    u.id as "userId",
                    u.name,
                    u.email,
                    COALESCE(h.count, 0) as houses,
                    COALESCE(f.count, 0) as favorites,
                    COALESCE(m.count, 0) as messages,
                    (COALESCE(h.count, 0) * 5 + COALESCE(f.count, 0) * 2 + COALESCE(m.count, 0)) as score
                FROM "User" u
                LEFT JOIN (
                    SELECT owner_id, count(*) as count
                    FROM "House"
                    WHERE "created_at" >= ${filter.from} AND "created_at" < ${filter.to}
                    GROUP BY owner_id
                ) h ON h.owner_id = u.id
                LEFT JOIN (
                    SELECT user_id, count(*) as count
                    FROM "Favorite"
                    WHERE "created_at" >= ${filter.from} AND "created_at" < ${filter.to}
                    GROUP BY user_id
                ) f ON f.user_id = u.id
                LEFT JOIN (
                    SELECT user_id, count(*) as count
                    FROM "Message"
                    WHERE "created_at" >= ${filter.from} AND "created_at" < ${filter.to}
                    GROUP BY user_id
                ) m ON m.user_id = u.id
                WHERE u.role = 'USER'
                ORDER BY score DESC
                LIMIT 20
            `
        );

        return rows.map(r => ({
            userId: r.userId,
            name: r.name,
            email: r.email,
            houses: Number(r.houses),
            favorites: Number(r.favorites),
            messages: Number(r.messages),
            score: Number(r.score),
        }));
    }

    private getComparisonRange(filter: TimeFilter) {
        if (filter.compare === 'none') return null;

        const durationMs = filter.to.getTime() - filter.from.getTime();
        if (filter.compare === 'previous_period') {
            const to = new Date(filter.from);
            const from = new Date(to.getTime() - durationMs);
            return { from, to };
        }

        // previous_year
        if (filter.compare === 'previous_year') {
            const from = new Date(filter.from);
            const to = new Date(filter.to);
            from.setUTCFullYear(from.getUTCFullYear() - 1);
            to.setUTCFullYear(to.getUTCFullYear() - 1);
            return { from, to };
        }

        return null;
    }

    private mockGeoIP(ip: string) {
        // Placeholder for real GeoIP logic
        if (ip.startsWith('113.') || ip.startsWith('115.')) return 'Vietnam';
        if (ip.startsWith('203.')) return 'Singapore';
        if (ip.startsWith('66.') || ip.startsWith('72.')) return 'USA';
        return 'Other';
    }
}
