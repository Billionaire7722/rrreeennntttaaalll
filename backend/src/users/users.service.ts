import { ForbiddenException, Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ToggleFavoriteDto } from './dto/toggle-favorite.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Role } from '../security/roles.enum';
import { MessagesGateway } from '../messages/messages.gateway';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        private prisma: PrismaService,
        private messagesGateway: MessagesGateway,
    ) { }

    private isSuperAdmin(role?: string) {
        return role === Role.SUPER_ADMIN;
    }

    async getFavorites(userId: string) {
        return this.prisma.favorite.findMany({
            where: {
                userId,
                house: { deleted_at: null }
            },
            include: { house: true }
        });
    }

    async toggleFavorite(userId: string, toggleFavoriteDto: ToggleFavoriteDto) {
        const { houseId } = toggleFavoriteDto;

        const houseExists = await this.prisma.house.findUnique({
            where: { id: houseId }
        });

        if (!houseExists || houseExists.deleted_at !== null) {
            throw new NotFoundException('House not found');
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
        } else {
            await this.prisma.favorite.create({
                data: { userId, houseId }
            });
            return { message: 'Favorite added' };
        }
    }

    async getMessageThread(userId: string, otherId: string) {
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

    async getConversations(userId: string) {
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

        const conversationsMap = new Map<string, any>();

        for (const msg of messages) {
            const otherUser = msg.userId === userId ? msg.receiver : msg.user;
            if (!otherUser) continue;

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

    async sendMessage(userId: string, sendMessageDto: SendMessageDto) {
        const receiverId = sendMessageDto.recipientId || null;

        if (receiverId) {
            const recipient = await this.prisma.user.findUnique({
                where: { id: receiverId },
                select: { id: true, deleted_at: true },
            });

            if (!recipient || recipient.deleted_at) {
                throw new NotFoundException('Recipient user not found');
            }
        }

        const message = await this.prisma.message.create({
            data: {
                userId,
                receiverId,
                senderId: userId,
                senderRole: Role.USER, // Default or derive from token if needed
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

        // Notify sender (for multi-tab sync and local update)
        await this.messagesGateway.emitToUser(userId, 'message_sent', realtimePayload);

        if (receiverId) {
            await this.messagesGateway.sendMessageToUser(receiverId, realtimePayload);
        } else {
            await this.messagesGateway.notifySuperAdmins(realtimePayload);
        }

        return message;
    }

    async getViewerMessages(adminId: string, adminRole: string, skip = 0, take = 50) {
        const where: any = {};
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

    async replyToViewer(adminId: string, adminRole: string, viewerId: string, sendMessageDto: SendMessageDto) {
        if (!this.isSuperAdmin(adminRole)) {
            throw new ForbiddenException('Only super admins can access this raw reply now, but let them reply anyway');
        }

        const viewer = await this.prisma.user.findUnique({
            where: { id: viewerId },
            select: { id: true, role: true, deleted_at: true },
        });

        if (!viewer || viewer.deleted_at) {
            throw new NotFoundException('User not found');
        }

        const message = await this.prisma.message.create({
            data: {
                userId: adminId, // The sender logic might need adaptation but this preserves original direction conceptually.
                receiverId: viewerId,
                senderId: adminId,
                senderRole: adminRole as Role,
                content: sendMessageDto.content,
            },
        });

        await this.messagesGateway.emitToUser(adminId, 'message_sent', message);
        await this.messagesGateway.sendMessageToUser(viewerId, message);

        return message;
    }

    async markConversationSeen(userId: string, otherId: string) {
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

    async markAdminConversationSeen(adminId: string, adminRole: string, viewerId: string) {
        if (!this.isSuperAdmin(adminRole)) {
            throw new ForbiddenException('Only super admins can do globals');
        }

        const result = await this.prisma.message.updateMany({
            where: {
                userId: viewerId,
                seen_at: null,
            },
            data: {
                seen_at: new Date(),
                seen_by_role: adminRole as Role,
            },
        });

        return { updated: result.count };
    }

    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        delete (user as any).password;
        return user;
    }

    async updateAvatar(userId: string, avatarUrl: string) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { avatarUrl },
        });
        delete (user as any).password;
        return user;
    }

    async updateCover(userId: string, coverUrl: string) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { coverUrl },
        });
        delete (user as any).password;
        return user;
    }

    async getPublicProfile(userId: string) {
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
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async updateProfile(userId: string, data: { firstName?: string; lastName?: string; bio?: string; email?: string }) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const updateData: any = {};

        if (data.bio !== undefined) {
            updateData.bio = data.bio;
        }

        if (data.email !== undefined && data.email.toLowerCase() !== user.email.toLowerCase()) {
            const existing = await this.prisma.user.findUnique({
                where: { email: data.email.toLowerCase() }
            });
            if (existing) {
                throw new ConflictException('Email is already in use');
            }
            updateData.email = data.email.toLowerCase();
        }

        const newFirstName = data.firstName !== undefined ? data.firstName : user.firstName;
        const newLastName = data.lastName !== undefined ? data.lastName : user.lastName;
        const newFullName = `${newFirstName || ''} ${newLastName || ''}`.trim();

        if (newFullName !== user.name) {
            const ONE_MONTH_IN_MS = 30 * 24 * 60 * 60 * 1000;
            if (user.name_updated_at && (Date.now() - user.name_updated_at.getTime() < ONE_MONTH_IN_MS)) {
                throw new ForbiddenException('You can only change your name once every 30 days');
            }
            updateData.firstName = newFirstName;
            updateData.lastName = newLastName;
            updateData.name = newFullName;
            updateData.name_updated_at = new Date();
        }

        if (Object.keys(updateData).length === 0) {
            delete (user as any).password;
            return user;
        }

        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: updateData,
        });

        delete (updatedUser as any).password;
        return updatedUser;
    }

    async changePassword(userId: string, data: ChangePasswordDto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const isMatch = await bcrypt.compare(data.oldPassword, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Incorrect old password');
        }

        if (data.newPassword !== data.confirmPassword) {
            throw new ConflictException('Passwords do not match');
        }

        const hashedPassword = await bcrypt.hash(data.newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        return { message: 'Password changed successfully' };
    }
}
