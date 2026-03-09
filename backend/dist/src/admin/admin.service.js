"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../prisma/prisma.service");
const roles_enum_1 = require("../security/roles.enum");
const presence_service_1 = require("../presence/presence.service");
let AdminService = class AdminService {
    prisma;
    presenceService;
    constructor(prisma, presenceService) {
        this.prisma = prisma;
        this.presenceService = presenceService;
    }
    async getAllUsers(skip = 0, take = 50, search, status) {
        const where = { role: roles_enum_1.Role.USER };
        if (status) {
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
                    _count: {
                        select: { ownedHouses: true }
                    }
                }
            }),
            this.prisma.user.count({ where })
        ]);
        return { users, total, skip: Number(skip), take: Number(take) };
    }
    async getAllAdmins(skip = 0, take = 50) {
        const where = {
            role: roles_enum_1.Role.SUPER_ADMIN,
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
    async updateAdmin(adminId, data) {
        const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
        if (!admin)
            throw new common_1.NotFoundException('User not found');
        if (admin.role === roles_enum_1.Role.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Cannot edit SUPER_ADMIN account');
        }
        const payload = {};
        if (data.name !== undefined)
            payload.name = data.name;
        if (data.phone !== undefined)
            payload.phone = data.phone;
        if (data.username !== undefined && data.username !== admin.username) {
            const usernameTaken = await this.prisma.user.findFirst({
                where: {
                    username: data.username,
                    id: { not: adminId }
                }
            });
            if (usernameTaken) {
                throw new common_1.ForbiddenException('Username already exists');
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
                throw new common_1.ForbiddenException('Email already exists');
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
    async changeMyPassword(userId, currentPassword, newPassword) {
        if (!currentPassword || !newPassword) {
            throw new common_1.ForbiddenException('Current password and new password are required');
        }
        if (newPassword.length < 8) {
            throw new common_1.ForbiddenException('New password must be at least 8 characters');
        }
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.role !== roles_enum_1.Role.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only SUPER_ADMIN can use this action');
        }
        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) {
            throw new common_1.ForbiddenException('Current password is incorrect');
        }
        const sameAsOld = await bcrypt.compare(newPassword, user.password);
        if (sameAsOld) {
            throw new common_1.ForbiddenException('New password must be different from current password');
        }
        const hashed = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashed },
        });
        return { message: 'Super-admin password updated successfully' };
    }
    async changeRole(adminId, newRole) {
        const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
        if (!admin)
            throw new common_1.NotFoundException('User not found');
        if (admin.role === roles_enum_1.Role.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Cannot modify SUPER_ADMIN role');
        }
        return this.prisma.user.update({
            where: { id: adminId },
            data: { role: newRole },
            select: { id: true, name: true, role: true }
        });
    }
    async changeStatus(adminId, status) {
        const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
        if (!admin)
            throw new common_1.NotFoundException('User not found');
        if (admin.role === roles_enum_1.Role.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Cannot modify SUPER_ADMIN status');
        }
        return this.prisma.user.update({
            where: { id: adminId },
            data: { status },
            select: { id: true, name: true, status: true }
        });
    }
    async softDeleteAdmin(adminId) {
        const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
        if (!admin)
            throw new common_1.NotFoundException('User not found');
        if (admin.role === roles_enum_1.Role.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Cannot delete SUPER_ADMIN');
        }
        return this.prisma.user.update({
            where: { id: adminId },
            data: { deleted_at: new Date() },
            select: { id: true, name: true, deleted_at: true }
        });
    }
    async restoreUser(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return this.prisma.user.update({
            where: { id: userId },
            data: { deleted_at: null },
            select: { id: true, name: true, deleted_at: true }
        });
    }
    async restoreHouse(houseId) {
        const house = await this.prisma.house.findUnique({ where: { id: houseId } });
        if (!house)
            throw new common_1.NotFoundException('House not found');
        return this.prisma.house.update({
            where: { id: houseId },
            data: { deleted_at: null },
        });
    }
    async getLoginLogs(skip = 0, take = 50, status) {
        const where = {};
        if (status === 'failed') {
            where.success = false;
        }
        else if (status === 'success') {
            where.success = true;
        }
        const [items, total] = await Promise.all([
            this.prisma.loginLog.findMany({
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
        const [totalUsers, totalAdmins, totalProperties, deletedProperties, loginAttemptsToday] = await Promise.all([
            this.prisma.user.count({ where: { role: roles_enum_1.Role.USER } }),
            this.prisma.user.count({ where: { role: roles_enum_1.Role.SUPER_ADMIN } }),
            this.prisma.house.count({ where: { deleted_at: null } }),
            this.prisma.house.count({ where: { deleted_at: { not: null } } }),
            this.prisma.loginLog.count({ where: { timestamp: { gte: todayStart } } })
        ]);
        const recentLogins = await this.prisma.loginLog.findMany({
            where: { timestamp: { gte: sevenDaysAgo } },
            select: { success: true, timestamp: true }
        });
        const loginDataMap = {};
        for (let i = 0; i <= 6; i++) {
            const d = new Date(sevenDaysAgo);
            d.setDate(d.getDate() + i);
            loginDataMap[d.toISOString().split('T')[0]] = { logins: 0, failed: 0 };
        }
        for (const log of recentLogins) {
            const dateStr = log.timestamp.toISOString().split('T')[0];
            if (loginDataMap[dateStr]) {
                if (log.success)
                    loginDataMap[dateStr].logins++;
                else
                    loginDataMap[dateStr].failed++;
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
        const actionDataMap = {};
        for (let i = 0; i <= 6; i++) {
            const d = new Date(sevenDaysAgo);
            d.setDate(d.getDate() + i);
            actionDataMap[d.toISOString().split('T')[0]] = { creates: 0, updates: 0, deletes: 0 };
        }
        for (const log of recentAudits) {
            const dateStr = log.createdAt.toISOString().split('T')[0];
            if (actionDataMap[dateStr]) {
                const type = log.actionType.toUpperCase();
                if (type.includes('CREATE'))
                    actionDataMap[dateStr].creates++;
                else if (type.includes('DELETE'))
                    actionDataMap[dateStr].deletes++;
                else
                    actionDataMap[dateStr].updates++;
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
        await this.prisma.user.updateMany({
            where: { role: roles_enum_1.Role.SUPER_ADMIN },
            data: { role: roles_enum_1.Role.USER }
        });
        const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'ceo@rentalapp.com';
        const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
        if (!superAdminPassword) {
            throw new common_1.ForbiddenException('SUPER_ADMIN_PASSWORD is required');
        }
        const hashedPassword = await bcrypt.hash(superAdminPassword, 10);
        const superAdmin = await this.prisma.user.upsert({
            where: { email: superAdminEmail },
            update: {
                role: roles_enum_1.Role.SUPER_ADMIN,
                status: 'ACTIVE',
                deleted_at: null,
                password: hashedPassword
            },
            create: {
                name: 'Master System Administrator',
                username: 'superadmin_ceo',
                email: superAdminEmail,
                password: hashedPassword,
                role: roles_enum_1.Role.SUPER_ADMIN,
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
    async createAdmin(data) {
        const existing = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: data.email },
                    { username: data.username },
                ],
            },
        });
        if (existing) {
            throw new common_1.ForbiddenException('Username or email already exists');
        }
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const admin = await this.prisma.user.create({
            data: {
                name: data.name,
                username: data.username,
                email: data.email,
                phone: data.phone,
                password: hashedPassword,
                role: roles_enum_1.Role.SUPER_ADMIN,
                status: 'ACTIVE',
            },
            select: { id: true, name: true, username: true, email: true, role: true, status: true },
        });
        return admin;
    }
    async createUser(data) {
        const existing = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: data.email },
                    { username: data.username },
                ],
            },
        });
        if (existing) {
            throw new common_1.ForbiddenException('Username or email already exists');
        }
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = await this.prisma.user.create({
            data: {
                name: data.name,
                username: data.username,
                email: data.email,
                phone: data.phone,
                password: hashedPassword,
                role: roles_enum_1.Role.USER,
                status: 'ACTIVE',
            },
            select: { id: true, name: true, username: true, email: true, role: true, status: true },
        });
        return user;
    }
    async getLiveSessions(skip = 0, take = 50, role) {
        const where = {
            role: {
                in: [roles_enum_1.Role.USER, roles_enum_1.Role.SUPER_ADMIN]
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
        const latestLoginByUser = new Map();
        for (const log of loginLogs) {
            if (!log.userId)
                continue;
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
        const [items, total] = await Promise.all([
            this.prisma.supportTicket.findMany({
                skip: Number(skip),
                take: Number(take),
                orderBy: { updatedAt: 'desc' },
                include: {
                    user: { select: { id: true, name: true, email: true, role: true } },
                    _count: { select: { messages: true } }
                }
            }),
            this.prisma.supportTicket.count()
        ]);
        return { items, total, skip: Number(skip), take: Number(take) };
    }
    async updateReportStatus(type, id, status) {
        if (type === 'user') {
            return this.prisma.userReport.update({ where: { id }, data: { status } });
        }
        return this.prisma.propertyReport.update({ where: { id }, data: { status } });
    }
    async updateTicketStatus(id, status) {
        return this.prisma.supportTicket.update({ where: { id }, data: { status } });
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        presence_service_1.PresenceService])
], AdminService);
//# sourceMappingURL=admin.service.js.map