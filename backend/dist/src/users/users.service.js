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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const roles_enum_1 = require("../security/roles.enum");
const messages_gateway_1 = require("../messages/messages.gateway");
const bcrypt = __importStar(require("bcrypt"));
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
    async getMessageThread(userId, otherId) {
        return this.prisma.message.findMany({
            where: {
                OR: [
                    { userId: userId, receiverId: otherId },
                    { userId: otherId, receiverId: userId }
                ]
            },
            orderBy: { created_at: 'asc' },
            include: {
                user: {
                    select: { id: true, name: true, avatarUrl: true }
                },
                receiver: {
                    select: { id: true, name: true, avatarUrl: true }
                }
            }
        });
    }
    async getConversations(userId) {
        const messages = await this.prisma.message.findMany({
            where: {
                OR: [
                    { userId: userId },
                    { receiverId: userId }
                ]
            },
            orderBy: { created_at: 'desc' },
            include: {
                user: {
                    select: { id: true, name: true, avatarUrl: true }
                },
                receiver: {
                    select: { id: true, name: true, avatarUrl: true }
                }
            }
        });
        const conversationsMap = new Map();
        for (const msg of messages) {
            const otherUser = msg.userId === userId ? msg.receiver : msg.user;
            if (!otherUser)
                continue;
            if (!conversationsMap.has(otherUser.id)) {
                conversationsMap.set(otherUser.id, {
                    otherUser,
                    lastMessage: msg,
                    unreadCount: 0
                });
            }
            const conv = conversationsMap.get(otherUser.id);
            if (msg.receiverId === userId && !msg.seen_at) {
                conv.unreadCount++;
            }
        }
        return Array.from(conversationsMap.values());
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
        const senderInfo = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, avatarUrl: true }
        });
        const realtimePayload = {
            ...message,
            user: senderInfo,
            recipientId: receiverId,
            houseId: sendMessageDto.houseId || null,
            houseTitle: sendMessageDto.houseTitle || null,
        };
        await this.messagesGateway.emitToUser(userId, 'message_sent', realtimePayload);
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
        await this.messagesGateway.emitToUser(adminId, 'message_sent', message);
        await this.messagesGateway.sendMessageToUser(viewerId, message);
        return message;
    }
    async markConversationSeen(userId, otherId) {
        const result = await this.prisma.message.updateMany({
            where: {
                userId: otherId,
                receiverId: userId,
                seen_at: null,
            },
            data: {
                seen_at: new Date(),
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
    async updateCover(userId, coverUrl) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { coverUrl },
        });
        delete user.password;
        return user;
    }
    async getPublicProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId, deleted_at: null },
            select: {
                id: true,
                name: true,
                avatarUrl: true,
                coverUrl: true,
                bio: true,
                created_at: true,
                ownedHouses: {
                    where: { deleted_at: null },
                    orderBy: { created_at: 'desc' },
                    select: {
                        id: true,
                        name: true,
                        property_type: true,
                        address: true,
                        district: true,
                        city: true,
                        price: true,
                        bedrooms: true,
                        square: true,
                        image_url_1: true,
                        status: true,
                        is_private_bathroom: true,
                    }
                }
            }
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async updateProfile(userId, data) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const updateData = {};
        if (data.bio !== undefined) {
            updateData.bio = data.bio;
        }
        if (data.email !== undefined && data.email.toLowerCase() !== user.email.toLowerCase()) {
            const existing = await this.prisma.user.findUnique({
                where: { email: data.email.toLowerCase() }
            });
            if (existing) {
                throw new common_1.ConflictException('Email is already in use');
            }
            updateData.email = data.email.toLowerCase();
        }
        const newFirstName = data.firstName !== undefined ? data.firstName : user.firstName;
        const newLastName = data.lastName !== undefined ? data.lastName : user.lastName;
        const newFullName = `${newFirstName || ''} ${newLastName || ''}`.trim();
        if (newFullName !== user.name) {
            const ONE_MONTH_IN_MS = 30 * 24 * 60 * 60 * 1000;
            if (user.name_updated_at && (Date.now() - user.name_updated_at.getTime() < ONE_MONTH_IN_MS)) {
                throw new common_1.ForbiddenException('You can only change your name once every 30 days');
            }
            updateData.firstName = newFirstName;
            updateData.lastName = newLastName;
            updateData.name = newFullName;
            updateData.name_updated_at = new Date();
        }
        if (Object.keys(updateData).length === 0) {
            delete user.password;
            return user;
        }
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: updateData,
        });
        delete updatedUser.password;
        return updatedUser;
    }
    async changePassword(userId, data) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const isMatch = await bcrypt.compare(data.oldPassword, user.password);
        if (!isMatch) {
            throw new common_1.UnauthorizedException('Incorrect old password');
        }
        if (data.newPassword !== data.confirmPassword) {
            throw new common_1.ConflictException('Passwords do not match');
        }
        const hashedPassword = await bcrypt.hash(data.newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });
        return { message: 'Password changed successfully' };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        messages_gateway_1.MessagesGateway])
], UsersService);
//# sourceMappingURL=users.service.js.map