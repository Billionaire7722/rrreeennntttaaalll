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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const roles_enum_1 = require("../security/roles.enum");
const messages_gateway_1 = require("../messages/messages.gateway");
let UsersService = class UsersService {
    prisma;
    messagesGateway;
    constructor(prisma, messagesGateway) {
        this.prisma = prisma;
        this.messagesGateway = messagesGateway;
    }
    isAdminRole(role) {
        return role === roles_enum_1.Role.ADMIN || role === roles_enum_1.Role.SUPER_ADMIN;
    }
    async getViewerAssignment(viewerId) {
        return this.prisma.viewerAdminAssignment.findUnique({
            where: { viewerId },
        });
    }
    async assignViewerToAdmin(viewerId, adminId) {
        const prismaAny = this.prisma;
        const existing = await prismaAny.viewerAdminAssignment.findUnique({
            where: { viewerId },
        });
        if (existing)
            return existing;
        return prismaAny.viewerAdminAssignment.create({
            data: {
                viewerId,
                adminId,
            },
        });
    }
    async getFavorites(userId) {
        return this.prisma.favorite.findMany({
            where: {
                userId,
                house: { deleted_at: null }
            },
            include: { house: true }
        });
    }
    async toggleFavorite(userId, toggleFavoriteDto) {
        const { houseId } = toggleFavoriteDto;
        const houseExists = await this.prisma.house.findUnique({
            where: { id: houseId }
        });
        if (!houseExists || houseExists.deleted_at !== null) {
            throw new common_1.NotFoundException('House not found');
        }
        const existingFavorite = await this.prisma.favorite.findUnique({
            where: {
                userId_houseId: {
                    userId,
                    houseId
                }
            }
        });
        if (existingFavorite) {
            await this.prisma.favorite.delete({
                where: { id: existingFavorite.id }
            });
            return { message: 'Favorite removed' };
        }
        else {
            await this.prisma.favorite.create({
                data: { userId, houseId }
            });
            return { message: 'Favorite added' };
        }
    }
    async getMessages(userId) {
        return this.prisma.message.findMany({
            where: { userId },
            orderBy: { created_at: 'desc' },
            include: {
                admin: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatarUrl: true,
                    },
                },
            },
        });
    }
    async sendMessage(userId, sendMessageDto) {
        let targetAdminId = null;
        if (sendMessageDto.recipientId) {
            const recipient = await this.prisma.user.findUnique({
                where: { id: sendMessageDto.recipientId },
                select: { id: true, role: true, deleted_at: true },
            });
            if (!recipient || recipient.deleted_at || !this.isAdminRole(recipient.role)) {
                throw new common_1.NotFoundException('Recipient admin not found');
            }
            const assignment = await this.getViewerAssignment(userId);
            if (!assignment) {
                await this.assignViewerToAdmin(userId, recipient.id);
                targetAdminId = recipient.id;
            }
            else {
                targetAdminId = assignment.adminId;
            }
        }
        else {
            const assignment = await this.getViewerAssignment(userId);
            targetAdminId = assignment?.adminId || null;
        }
        const message = await this.prisma.message.create({
            data: {
                userId,
                adminId: targetAdminId,
                senderId: userId,
                senderRole: roles_enum_1.Role.VIEWER,
                content: sendMessageDto.content
            }
        });
        const realtimePayload = {
            ...message,
            recipientId: targetAdminId,
            houseId: sendMessageDto.houseId || null,
            houseTitle: sendMessageDto.houseTitle || null,
        };
        if (targetAdminId) {
            await this.messagesGateway.notifyAdmins(realtimePayload, targetAdminId);
        }
        else {
            await this.messagesGateway.notifySuperAdmins(realtimePayload);
        }
        return message;
    }
    async getViewerMessages(adminId, adminRole, skip = 0, take = 50) {
        const where = {};
        if (adminRole === roles_enum_1.Role.ADMIN) {
            where.user = {
                viewerAssignment: {
                    adminId,
                },
            };
        }
        const messages = await this.prisma.message.findMany({
            where,
            skip: Number(skip),
            take: Number(take),
            orderBy: { created_at: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        email: true,
                        phone: true,
                        role: true,
                    },
                },
                admin: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatarUrl: true,
                    },
                },
            },
        });
        return { items: messages, skip: Number(skip), take: Number(take) };
    }
    async replyToViewer(adminId, adminRole, viewerId, sendMessageDto) {
        if (!this.isAdminRole(adminRole)) {
            throw new common_1.ForbiddenException('Only admins can reply to viewers');
        }
        const viewer = await this.prisma.user.findUnique({
            where: { id: viewerId },
            select: { id: true, role: true, deleted_at: true },
        });
        if (!viewer || viewer.deleted_at || viewer.role !== roles_enum_1.Role.VIEWER) {
            throw new common_1.NotFoundException('Viewer not found');
        }
        const assignment = await this.getViewerAssignment(viewerId);
        if (adminRole === roles_enum_1.Role.ADMIN) {
            if (assignment && assignment.adminId !== adminId) {
                throw new common_1.ForbiddenException('This viewer is handled by another admin');
            }
            if (!assignment) {
                await this.assignViewerToAdmin(viewerId, adminId);
            }
        }
        const message = await this.prisma.message.create({
            data: {
                userId: viewerId,
                adminId: adminId,
                senderId: adminId,
                senderRole: adminRole,
                content: sendMessageDto.content,
            },
        });
        await this.messagesGateway.sendMessageToUser(viewerId, message);
        return message;
    }
    async markViewerConversationSeen(viewerId, adminId) {
        const assignment = await this.getViewerAssignment(viewerId);
        if (!assignment || assignment.adminId !== adminId) {
            throw new common_1.ForbiddenException('This conversation is not available for this viewer');
        }
        const result = await this.prisma.message.updateMany({
            where: {
                userId: viewerId,
                adminId,
                senderRole: { in: [roles_enum_1.Role.ADMIN, roles_enum_1.Role.SUPER_ADMIN] },
                seen_at: null,
            },
            data: {
                seen_at: new Date(),
                seen_by_role: roles_enum_1.Role.VIEWER,
            },
        });
        return { updated: result.count };
    }
    async markAdminConversationSeen(adminId, adminRole, viewerId) {
        if (!this.isAdminRole(adminRole)) {
            throw new common_1.ForbiddenException('Only admins can mark messages as seen');
        }
        const assignment = await this.getViewerAssignment(viewerId);
        if (adminRole === roles_enum_1.Role.ADMIN) {
            if (!assignment || assignment.adminId !== adminId) {
                throw new common_1.ForbiddenException('This viewer is handled by another admin');
            }
        }
        const where = {
            userId: viewerId,
            senderRole: roles_enum_1.Role.VIEWER,
            seen_at: null,
        };
        if (adminRole === roles_enum_1.Role.ADMIN) {
            where.adminId = adminId;
        }
        const result = await this.prisma.message.updateMany({
            where,
            data: {
                seen_at: new Date(),
                seen_by_role: adminRole,
            },
        });
        return { updated: result.count };
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        delete user.password;
        return user;
    }
    async updateAvatar(userId, avatarUrl) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { avatarUrl },
        });
        delete user.password;
        return user;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        messages_gateway_1.MessagesGateway])
], UsersService);
//# sourceMappingURL=users.service.js.map