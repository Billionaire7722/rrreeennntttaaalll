import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ToggleFavoriteDto } from './dto/toggle-favorite.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { Role } from '../security/roles.enum';
import { MessagesGateway } from '../messages/messages.gateway';

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

    async getMessages(userId: string) {
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

        const realtimePayload = {
            ...message,
            recipientId: receiverId,
            houseId: sendMessageDto.houseId || null,
            houseTitle: sendMessageDto.houseTitle || null,
        };

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

        await this.messagesGateway.sendMessageToUser(viewerId, message);

        return message;
    }

    async markViewerConversationSeen(viewerId: string, adminId: string) {
        // Simplified
        const result = await this.prisma.message.updateMany({
            where: {
                userId: viewerId,
                receiverId: adminId,
                seen_at: null,
            },
            data: {
                seen_at: new Date(),
                seen_by_role: Role.USER,
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
}
