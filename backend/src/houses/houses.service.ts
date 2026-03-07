import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../security/roles.enum';

@Injectable()
export class HousesService {

    constructor(private prisma: PrismaService) { }

    private isAdminRole(role?: string) {
        return role === Role.SUPER_ADMIN;
    }

    private async fetchCoordinatesFromAddress(queries: string[]): Promise<{ lat: number, lon: number } | null> {
        for (const baseQuery of queries) {
            const normalized = String(baseQuery || '').trim();
            if (!normalized) continue;

            const candidateQueries = [normalized];
            if (!/viet\s*nam/i.test(normalized)) {
                candidateQueries.push(`${normalized}, Vietnam`);
            }

            try {
                for (const query of candidateQueries) {
                    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
                    const response = await fetch(url, { headers: { 'User-Agent': 'RentalAdminApp/1.0' } });
                    if (!response.ok) continue;
                    const data = await response.json();
                    if (data && data.length > 0) {
                        const lat = parseFloat(data[0].lat);
                        const lon = parseFloat(data[0].lon);
                        if (Number.isFinite(lat) && Number.isFinite(lon)) {
                            return { lat, lon };
                        }
                    }
                }
            } catch (e) {
                console.error(`Failed to fetch coords from Nominatim for "${normalized}":`, e);
            }
        }
        return null;
    }

    private async assertUserCanManageHouse(houseId: string, actorId?: string, actorRole?: string) {
        if (!actorId) return;
        if (actorRole === Role.SUPER_ADMIN) return;

        const prismaAny = this.prisma as any;
        const house = await prismaAny.house.findUnique({
            where: { id: houseId }
        });

        if (!house || house.owner_id !== actorId) {
            throw new ForbiddenException('You cannot manage houses created by others');
        }
    }

    async getHouses(skip: number = 0, take: number = 10, ownerId?: string) {
        const prismaAny = this.prisma as any;
        const whereClause: any = { deleted_at: null };
        if (ownerId) { whereClause.owner_id = ownerId; }
        const [data, total] = await Promise.all([
            prismaAny.house.findMany({
                where: whereClause,
                skip,
                take,
                orderBy: { created_at: 'desc' },
                select: {
                    id: true,
                    original_id: true,
                    name: true,
                    created_at: true,
                    updated_at: true,
                    address: true,
                    district: true,
                    city: true,
                    price: true,
                    bedrooms: true,
                    square: true,
                    description: true,
                    contact_phone: true,
                    image_url_1: true,
                    status: true,
                    is_private_bathroom: true,
                    latitude: true,
                    longitude: true,
                    owner: {
                        select: {
                            id: true,
                            name: true,
                            avatarUrl: true
                        }
                    }
                }
            }),
            prismaAny.house.count({ where: whereClause })
        ]);

        const mappedData = data.map((house: any) => ({
            ...house,
            postedByAdmins: house.owner ? [house.owner] : [],
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

    async getHouseById(id: string, ownerId?: string) {
        const prismaAny = this.prisma as any;
        const house = await prismaAny.house.findFirst({
            where: {
                id,
                deleted_at: null,
                ...(ownerId ? { owner_id: ownerId } : {}),
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true
                    }
                }
            }
        });
        if (!house) throw new Error('House not found');
        return {
            ...house,
            postedByAdmins: house.owner ? [house.owner] : [],
        };
    }

    async updateHouse(id: string, data: any, actorId?: string, actorRole?: string) {
        const prismaAny = this.prisma as any;
        const house = await prismaAny.house.findFirst({ where: { id, deleted_at: null } });
        if (!house) throw new Error('House not found');
        await this.assertUserCanManageHouse(id, actorId, actorRole);

        let finalLat = data.latitude !== undefined ? Number(data.latitude) : undefined;
        let finalLon = data.longitude !== undefined ? Number(data.longitude) : undefined;

        const normalizedAddress = String(data.address || house.address || '').trim();
        const normalizedDistrict = String(data.district || house.district || '').trim();
        const normalizedCity = String(data.city || house.city || '').trim();

        if (data.address !== undefined && data.address !== house.address) {
            const searchQueries: string[] = [];
            if (normalizedAddress && normalizedDistrict && normalizedCity) {
                searchQueries.push(`${normalizedAddress}, ${normalizedDistrict}, ${normalizedCity}`);
            }
            if (normalizedAddress && normalizedCity) {
                searchQueries.push(`${normalizedAddress}, ${normalizedCity}`);
            }
            if (normalizedDistrict && normalizedCity) {
                searchQueries.push(`${normalizedDistrict}, ${normalizedCity}`);
            }
            if (normalizedCity) searchQueries.push(normalizedCity);
            if (normalizedAddress) searchQueries.push(normalizedAddress);

            const coords = await this.fetchCoordinatesFromAddress(searchQueries);
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
                ...(data.city !== undefined && { city: data.city }),
                ...(data.district !== undefined && { district: data.district }),
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
                ...(data.image_url_4 !== undefined && { image_url_4: data.image_url_4 }),
                ...(data.image_url_5 !== undefined && { image_url_5: data.image_url_5 }),
                ...(data.image_url_6 !== undefined && { image_url_6: data.image_url_6 }),
                ...(data.image_url_7 !== undefined && { image_url_7: data.image_url_7 }),
                ...(data.video_url_1 !== undefined && { video_url_1: data.video_url_1 }),
                ...(data.video_url_2 !== undefined && { video_url_2: data.video_url_2 }),
            },
        });

        const refreshedHouse = await prismaAny.house.findFirst({
            where: { id, deleted_at: null },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true
                    },
                },
            },
        });

        if (!refreshedHouse) throw new Error('House not found');
        return {
            ...refreshedHouse,
            postedByAdmins: refreshedHouse.owner ? [refreshedHouse.owner] : [],
        };
    }

    async createHouse(data: any, actorId?: string, actorRole?: string) {
        const prismaAny = this.prisma as any;

        const normalizeNumber = (value: unknown): number | null => {
            if (value === undefined || value === null || value === '') return null;
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : null;
        };

        let finalLat = normalizeNumber(data.latitude);
        let finalLon = normalizeNumber(data.longitude);

        const normalizedAddress = String(data.address || '').trim();
        const normalizedDistrict = String(data.district || '').trim();
        const normalizedCity = String(data.city || '').trim();

        if (data.address) {
            const searchQueries: string[] = [];
            if (normalizedAddress && normalizedDistrict && normalizedCity) {
                searchQueries.push(`${normalizedAddress}, ${normalizedDistrict}, ${normalizedCity}`);
            }
            if (normalizedAddress && normalizedCity) {
                searchQueries.push(`${normalizedAddress}, ${normalizedCity}`);
            }
            if (normalizedDistrict && normalizedCity) {
                searchQueries.push(`${normalizedDistrict}, ${normalizedCity}`);
            }
            if (normalizedCity) searchQueries.push(normalizedCity);
            if (normalizedAddress) searchQueries.push(normalizedAddress);

            const coords = await this.fetchCoordinatesFromAddress(searchQueries);
            if (coords) {
                finalLat = coords.lat;
                finalLon = coords.lon;
            }
        }

        const addressParts = normalizedAddress.split(',').map((part: string) => part.trim()).filter(Boolean);
        const fallbackCity = normalizedCity || addressParts[addressParts.length - 1] || '';
        const fallbackDistrict = normalizedDistrict || (addressParts.length >= 2 ? addressParts[addressParts.length - 2] : '');

        const createdHouse = await this.prisma.house.create({
            data: {
                original_id: data.original_id || Math.random().toString(36).substring(7),
                name: data.name,
                address: normalizedAddress,
                latitude: finalLat,
                longitude: finalLon,
                price: data.price,
                bedrooms: data.bedrooms,
                square: data.square,
                description: data.description,
                contact_phone: data.contact_phone,
                is_private_bathroom: data.is_private_bathroom,
                status: data.status || 'available',
                city: fallbackCity,
                district: fallbackDistrict,
                property_type: data.property_type,
                image_url_1: data.image_url_1 || null,
                image_url_2: data.image_url_2 || null,
                image_url_3: data.image_url_3 || null,
                image_url_4: data.image_url_4 || null,
                image_url_5: data.image_url_5 || null,
                image_url_6: data.image_url_6 || null,
                image_url_7: data.image_url_7 || null,
                video_url_1: data.video_url_1 || null,
                video_url_2: data.video_url_2 || null,
                owner_id: actorId,
            }
        });

        const populatedHouse = await prismaAny.house.findFirst({
            where: { id: createdHouse.id, deleted_at: null },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true
                    },
                },
            },
        });

        if (!populatedHouse) throw new Error('House not found');
        return {
            ...populatedHouse,
            postedByAdmins: populatedHouse.owner ? [populatedHouse.owner] : [],
        };
    }

    async updateStatus(id: string, status: string, actorId?: string, actorRole?: string) {
        const house = await this.prisma.house.findUnique({
            where: { id }
        });
        if (!house) throw new Error('House not found');
        await this.assertUserCanManageHouse(id, actorId, actorRole);

        return this.prisma.house.update({
            where: { id },
            data: { status }
        });
    }

    async removeHouse(id: string, actorId?: string, actorRole?: string) {
        const house = await this.prisma.house.findUnique({
            where: { id }
        });
        if (!house) throw new Error('House not found');
        await this.assertUserCanManageHouse(id, actorId, actorRole);

        return this.prisma.house.update({
            where: { id },
            data: { deleted_at: new Date() }
        });
    }
}

