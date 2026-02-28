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
exports.HousesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let HousesService = class HousesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getHouses(skip = 0, take = 10) {
        const [data, total] = await Promise.all([
            this.prisma.house.findMany({
                where: { deleted_at: null },
                skip,
                take,
                orderBy: { created_at: 'desc' },
                select: {
                    id: true,
                    original_id: true,
                    name: true,
                    address: true,
                    district: true,
                    city: true,
                    price: true,
                    bedrooms: true,
                    square: true,
                    image_url_1: true,
                    status: true,
                    is_private_bathroom: true,
                    latitude: true,
                    longitude: true,
                }
            }),
            this.prisma.house.count({ where: { deleted_at: null } })
        ]);
        return {
            data,
            meta: {
                total,
                skip,
                take,
                hasMore: skip + take < total
            }
        };
    }
    async getHouseById(id) {
        const house = await this.prisma.house.findFirst({
            where: { id, deleted_at: null }
        });
        if (!house)
            throw new Error('House not found');
        return house;
    }
    async updateHouse(id, data) {
        const house = await this.prisma.house.findFirst({ where: { id, deleted_at: null } });
        if (!house)
            throw new Error('House not found');
        return this.prisma.house.update({
            where: { id },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.address !== undefined && { address: data.address }),
                ...(data.price !== undefined && { price: Number(data.price) }),
                ...(data.bedrooms !== undefined && { bedrooms: Number(data.bedrooms) }),
                ...(data.square !== undefined && { square: Number(data.square) }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.latitude !== undefined && { latitude: Number(data.latitude) }),
                ...(data.longitude !== undefined && { longitude: Number(data.longitude) }),
                ...(data.image_url_1 !== undefined && { image_url_1: data.image_url_1 }),
                ...(data.image_url_2 !== undefined && { image_url_2: data.image_url_2 }),
                ...(data.image_url_3 !== undefined && { image_url_3: data.image_url_3 }),
            },
        });
    }
    async createHouse(data) {
        return this.prisma.house.create({
            data: {
                original_id: data.original_id || Math.random().toString(36).substring(7),
                name: data.name,
                address: data.address,
                latitude: data.latitude,
                longitude: data.longitude,
                price: data.price,
                bedrooms: data.bedrooms,
                square: data.square,
                description: data.description,
                is_private_bathroom: data.is_private_bathroom,
                status: data.status || 'available',
                city: data.city || '',
                district: data.district || '',
                image_url_1: data.image_url_1,
                image_url_2: data.image_url_2,
                image_url_3: data.image_url_3,
            }
        });
    }
    async updateStatus(id, status) {
        const house = await this.prisma.house.findUnique({
            where: { id }
        });
        if (!house)
            throw new Error('House not found');
        return this.prisma.house.update({
            where: { id },
            data: { status }
        });
    }
    async removeHouse(id) {
        const house = await this.prisma.house.findUnique({
            where: { id }
        });
        if (!house)
            throw new Error('House not found');
        return this.prisma.house.update({
            where: { id },
            data: { deleted_at: new Date() }
        });
    }
};
exports.HousesService = HousesService;
exports.HousesService = HousesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HousesService);
//# sourceMappingURL=houses.service.js.map