import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HousesService {
    constructor(private prisma: PrismaService) { }

    async getHouses(skip: number = 0, take: number = 10) {
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

    async getHouseById(id: string) {
        const house = await this.prisma.house.findFirst({
            where: { id, deleted_at: null }
        });
        if (!house) throw new Error('House not found');
        return house;
    }

    async updateHouse(id: string, data: any) {
        const house = await this.prisma.house.findFirst({ where: { id, deleted_at: null } });
        if (!house) throw new Error('House not found');

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

    async createHouse(data: any) {
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

    async updateStatus(id: string, status: string) {
        const house = await this.prisma.house.findUnique({
            where: { id }
        });
        if (!house) throw new Error('House not found');

        return this.prisma.house.update({
            where: { id },
            data: { status }
        });
    }

    async removeHouse(id: string) {
        const house = await this.prisma.house.findUnique({
            where: { id }
        });
        if (!house) throw new Error('House not found');

        return this.prisma.house.update({
            where: { id },
            data: { deleted_at: new Date() }
        });
    }
}
