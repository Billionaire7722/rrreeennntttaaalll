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
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
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
            orderBy: { created_at: 'desc' }
        });
    }
    async sendMessage(userId, sendMessageDto) {
        return this.prisma.message.create({
            data: {
                userId,
                senderId: userId,
                senderRole: roles_enum_1.Role.VIEWER,
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
    async replyToViewer(adminId, adminRole, viewerId, sendMessageDto) {
        const viewer = await this.prisma.user.findUnique({
            where: { id: viewerId },
            select: { id: true, role: true, deleted_at: true },
        });
        if (!viewer || viewer.deleted_at || viewer.role !== roles_enum_1.Role.VIEWER) {
            throw new common_1.NotFoundException('Viewer not found');
        }
        return this.prisma.message.create({
            data: {
                userId: viewerId,
                senderId: adminId,
                senderRole: adminRole,
                content: sendMessageDto.content,
            },
        });
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
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map