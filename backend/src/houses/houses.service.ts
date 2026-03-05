import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../security/roles.enum';

@Injectable()
export class HousesService {
    constructor(private prisma: PrismaService) { }

    private isAdminRole(role?: string) {
        return role === Role.ADMIN || role === Role.SUPER_ADMIN;
    }

    private formatPostedByAdmins(houseAdmins: Array<{ admin: { id: string; name: string } }>) {
        return houseAdmins.map((item) => ({
            id: item.admin.id,
            name: item.admin.name,
            avatarUrl: null,
        }));
    }

    private async fetchCoordinatesFromAddress(address: string): Promise<{ lat: number, lon: number } | null> {
        try {
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
            const response = await fetch(url, { headers: { 'User-Agent': 'RentalAdminApp/1.0' } });
            if (!response.ok) return null;
            const data = await response.json();
            if (data && data.length > 0) {
                return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
            }
        } catch (e) {
            console.error('Failed to fetch coords from Nominatim:', e);
        }
        return null;
    }

    private async attachPoster(houseId: string, actorId?: string, actorRole?: string) {
        if (!actorId || !this.isAdminRole(actorRole)) return;
        const prismaAny = this.prisma as any;

        await prismaAny.houseAdmin.upsert({
            where: {
                houseId_adminId: {
                    houseId,
                    adminId: actorId,
                }
            },
            create: {
                houseId,
                adminId: actorId,
            },
            update: {},
        });
    }

    async getHouses(skip: number = 0, take: number = 10) {
        const prismaAny = this.prisma as any;
        const [data, total] = await Promise.all([
            prismaAny.house.findMany({
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
                    houseAdmins: {
                        select: {
                            admin: {
                                select: {
                                    id: true,
                                    name: true,
                                }
                            }
                        }
                    }
                }
            }),
            prismaAny.house.count({ where: { deleted_at: null } })
        ]);

        const mappedData = data.map((house: any) => ({
            ...house,
            postedByAdmins: this.formatPostedByAdmins(house.houseAdmins),
        }));

        return {
            data: mappedData,
            meta: {
                total,
                skip,
                take,
                hasMore: skip + take < total
            }
        };
    }

    async getHouseById(id: string) {
        const prismaAny = this.prisma as any;
        const house = await prismaAny.house.findFirst({
            where: { id, deleted_at: null },
            include: {
                houseAdmins: {
                    select: {
                        admin: {
                            select: {
                                id: true,
                                name: true,
                            }
                        }
                    }
                }
            }
        });
        if (!house) throw new Error('House not found');
        return {
            ...house,
            postedByAdmins: this.formatPostedByAdmins((house as any).houseAdmins || []),
        };
    }

    async updateHouse(id: string, data: any, actorId?: string, actorRole?: string) {
        const prismaAny = this.prisma as any;
        const house = await this.prisma.house.findFirst({ where: { id, deleted_at: null } });
        if (!house) throw new Error('House not found');

        let finalLat = data.latitude !== undefined ? Number(data.latitude) : undefined;
        let finalLon = data.longitude !== undefined ? Number(data.longitude) : undefined;

        if (data.address !== undefined && data.address !== house.address) {
            const coords = await this.fetchCoordinatesFromAddress(data.address);
            if (coords) {
                finalLat = coords.lat;
                finalLon = coords.lon;
            }
        }

        await this.prisma.house.update({
            where: { id },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.address !== undefined && { address: data.address }),
                ...(data.price !== undefined && { price: Number(data.price) }),
                ...(data.bedrooms !== undefined && { bedrooms: Number(data.bedrooms) }),
                ...(data.square !== undefined && { square: Number(data.square) }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.contact_phone !== undefined && { contact_phone: data.contact_phone }),
                ...(finalLat !== undefined && { latitude: finalLat }),
                ...(finalLon !== undefined && { longitude: finalLon }),
                ...(data.image_url_1 !== undefined && { image_url_1: data.image_url_1 }),
                ...(data.image_url_2 !== undefined && { image_url_2: data.image_url_2 }),
                ...(data.image_url_3 !== undefined && { image_url_3: data.image_url_3 }),
            },
        });

        await this.attachPoster(id, actorId, actorRole);
        const refreshedHouse = await prismaAny.house.findFirst({
            where: { id, deleted_at: null },
            include: {
                houseAdmins: {
                    select: {
                        admin: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        if (!refreshedHouse) throw new Error('House not found');
        return {
            ...refreshedHouse,
            postedByAdmins: this.formatPostedByAdmins((refreshedHouse as any).houseAdmins || []),
        };
    }

    async createHouse(data: any, actorId?: string, actorRole?: string) {
        const prismaAny = this.prisma as any;

        let finalLat = data.latitude ? Number(data.latitude) : 0;
        let finalLon = data.longitude ? Number(data.longitude) : 0;

        if (data.address) {
            const coords = await this.fetchCoordinatesFromAddress(data.address);
            if (coords) {
                finalLat = coords.lat;
                finalLon = coords.lon;
            }
        }

        const createdHouse = await this.prisma.house.create({
            data: {
                original_id: data.original_id || Math.random().toString(36).substring(7),
                name: data.name,
                address: data.address,
                latitude: finalLat,
                longitude: finalLon,
                price: data.price,
                bedrooms: data.bedrooms,
                square: data.square,
                description: data.description,
                contact_phone: data.contact_phone,
                is_private_bathroom: data.is_private_bathroom,
                status: data.status || 'available',
                city: data.city || '',
                district: data.district || '',
                image_url_1: data.image_url_1,
                image_url_2: data.image_url_2,
                image_url_3: data.image_url_3,
            }
        });

        await this.attachPoster(createdHouse.id, actorId, actorRole);
        const populatedHouse = await prismaAny.house.findFirst({
            where: { id: createdHouse.id, deleted_at: null },
            include: {
                houseAdmins: {
                    select: {
                        admin: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        if (!populatedHouse) throw new Error('House not found');
        return {
            ...populatedHouse,
            postedByAdmins: this.formatPostedByAdmins((populatedHouse as any).houseAdmins || []),
        };
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
