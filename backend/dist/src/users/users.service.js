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
    isSuperAdmin(role) {
        return role === roles_enum_1.Role.SUPER_ADMIN;
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
            where: {
                OR: [
                    { userId: userId },
                    { receiverId: userId }
                ]
            },
            orderBy: { created_at: 'desc' },
            include: {
                receiver: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatarUrl: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatarUrl: true,
                    },
                }
            },
        });
    }
    async sendMessage(userId, sendMessageDto) {
        const receiverId = sendMessageDto.recipientId || null;
        if (receiverId) {
            const recipient = await this.prisma.user.findUnique({
                where: { id: receiverId },
                select: { id: true, deleted_at: true },
            });
            if (!recipient || recipient.deleted_at) {
                throw new common_1.NotFoundException('Recipient user not found');
            }
        }
        const message = await this.prisma.message.create({
            data: {
                userId,
                receiverId,
                senderId: userId,
                senderRole: roles_enum_1.Role.USER,
                content: sendMessageDto.content
            }
        });
        const realtimePayload = {
            ...message,
            recipientId: receiverId,
            houseId: sendMessageDto.houseId || null,
            houseTitle: sendMessageDto.houseTitle || null,
        };
        if (receiverId) {
            await this.messagesGateway.sendMessageToUser(receiverId, realtimePayload);
        }
        else {
            await this.messagesGateway.notifySuperAdmins(realtimePayload);
        }
        return message;
    }
    async getViewerMessages(adminId, adminRole, skip = 0, take = 50) {
        const where = {};
        if (!this.isSuperAdmin(adminRole)) {
            where.receiverId = adminId;
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
                receiver: {
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
        if (!this.isSuperAdmin(adminRole)) {
            throw new common_1.ForbiddenException('Only super admins can access this raw reply now, but let them reply anyway');
        }
        const viewer = await this.prisma.user.findUnique({
            where: { id: viewerId },
            select: { id: true, role: true, deleted_at: true },
        });
        if (!viewer || viewer.deleted_at) {
            throw new common_1.NotFoundException('User not found');
        }
        const message = await this.prisma.message.create({
            data: {
                userId: adminId,
                receiverId: viewerId,
                senderId: adminId,
                senderRole: adminRole,
                content: sendMessageDto.content,
            },
        });
        await this.messagesGateway.sendMessageToUser(viewerId, message);
        return message;
    }
    async markViewerConversationSeen(viewerId, adminId) {
        const result = await this.prisma.message.updateMany({
            where: {
                userId: viewerId,
                receiverId: adminId,
                seen_at: null,
            },
            data: {
                seen_at: new Date(),
                seen_by_role: roles_enum_1.Role.USER,
            },
        });
        return { updated: result.count };
    }
    async markAdminConversationSeen(adminId, adminRole, viewerId) {
        if (!this.isSuperAdmin(adminRole)) {
            throw new common_1.ForbiddenException('Only super admins can do globals');
        }
        const result = await this.prisma.message.updateMany({
            where: {
                userId: viewerId,
                seen_at: null,
            },
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