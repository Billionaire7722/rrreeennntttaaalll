import { Injectable, NotFoundException } from '@nestjs/common';
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
            where: { userId },
            orderBy: { created_at: 'desc' }
        });
    }

    async sendMessage(userId: string, sendMessageDto: SendMessageDto) {
        const message = await this.prisma.message.create({
            data: {
                userId,
                senderId: userId,
                senderRole: Role.VIEWER,
                content: sendMessageDto.content
            }
        });

        const realtimePayload = {
            ...message,
            recipientId: sendMessageDto.recipientId || null,
            houseId: sendMessageDto.houseId || null,
            houseTitle: sendMessageDto.houseTitle || null,
        };

        if (sendMessageDto.recipientId) {
            await this.messagesGateway.notifyAdmins(realtimePayload, sendMessageDto.recipientId);
        } else {
            await this.messagesGateway.notifyAdmins(realtimePayload);
        }

        return message;
    }

    async getViewerMessages(skip = 0, take = 50) {
        const messages = await this.prisma.message.findMany({
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
            },
        });

        return { items: messages, skip: Number(skip), take: Number(take) };
    }

    async replyToViewer(adminId: string, adminRole: string, viewerId: string, sendMessageDto: SendMessageDto) {
        const viewer = await this.prisma.user.findUnique({
            where: { id: viewerId },
            select: { id: true, role: true, deleted_at: true },
        });

        if (!viewer || viewer.deleted_at || viewer.role !== Role.VIEWER) {
            throw new NotFoundException('Viewer not found');
        }

        const message = await this.prisma.message.create({
            data: {
                userId: viewerId,
                senderId: adminId,
                senderRole: adminRole as Role,
                content: sendMessageDto.content,
            },
        });

        await this.messagesGateway.sendMessageToUser(viewerId, message);

        return message;
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
