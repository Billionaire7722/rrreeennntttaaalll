import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ToggleFavoriteDto } from './dto/toggle-favorite.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { Role } from '../security/roles.enum';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

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
        return this.prisma.message.create({
            data: {
                userId,
                senderId: userId,
                senderRole: Role.VIEWER,
                content: sendMessageDto.content
            }
        });
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

        return this.prisma.message.create({
            data: {
                userId: viewerId,
                senderId: adminId,
                senderRole: adminRole as Role,
                content: sendMessageDto.content,
            },
        });
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
}
