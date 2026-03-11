import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../security/roles.enum';
import { ActivityLogService } from '../admin/activity-log.service';
import { MonitoringService } from '../admin/monitoring.service';

@Injectable()
export class HousesService {

    constructor(
        private prisma: PrismaService,
        private activityLogService: ActivityLogService,
        private monitoringService: MonitoringService
    ) { }

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
                console.error('Failed to fetch coords from Nominatim', { query: normalized, error: e });
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

    async getHouses(skip: number = 0, take: number = 10, ownerId?: string, search?: string, status?: string) {
        const prismaAny = this.prisma as any;
        const whereClause: any = {};

        if (status === 'deleted') {
            whereClause.deleted_at = { not: null };
        } else {
            whereClause.deleted_at = null;
            if (status) {
                whereClause.status = status;
            }
        }

        if (ownerId) { 
            whereClause.owner_id = ownerId; 
        }

        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { address: { contains: search, mode: 'insensitive' } },
                { district: { contains: search, mode: 'insensitive' } },
                { city: { contains: search, mode: 'insensitive' } },
            ];
        }

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
                    ward: true,
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
                    deleted_at: true,
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
        const normalizedWard = String(data.ward || house.ward || '').trim();
        const normalizedDistrict = String(data.district || house.district || '').trim();
        const normalizedCity = String(data.city || house.city || '').trim();

        if ((data.latitude === undefined || data.longitude === undefined) && 
            (data.address !== undefined || data.ward !== undefined || data.district !== undefined || data.city !== undefined)) {
            
            const searchQueries: string[] = [];
            if (normalizedAddress && normalizedWard && normalizedDistrict && normalizedCity) {
                searchQueries.push(`${normalizedAddress}, ${normalizedWard}, ${normalizedDistrict}, ${normalizedCity}`);
            }
            if (normalizedAddress && normalizedDistrict && normalizedCity) {
                searchQueries.push(`${normalizedAddress}, ${normalizedDistrict}, ${normalizedCity}`);
            }
            if (normalizedCity) searchQueries.push(normalizedCity);

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
                ...(data.ward !== undefined && { ward: data.ward }),
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

        // Log House Update
        if (actorId) {
            await this.activityLogService.log(
                actorId,
                'property_updated',
                `Updated property: ${refreshedHouse.name}`,
                { houseId: id } as any
            );
        }

        // Trigger Fraud Detection
        this.monitoringService.detectPropertyFraud(id).catch(err => {
            console.error('Fraud detection failed', err);
        });

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
        const normalizedWard = String(data.ward || '').trim();
        const normalizedDistrict = String(data.district || '').trim();
        const normalizedCity = String(data.city || '').trim();

        if (finalLat === null || finalLon === null) {
            const searchQueries: string[] = [];
            if (normalizedAddress && normalizedWard && normalizedDistrict && normalizedCity) {
                searchQueries.push(`${normalizedAddress}, ${normalizedWard}, ${normalizedDistrict}, ${normalizedCity}`);
            } else if (normalizedAddress && normalizedDistrict && normalizedCity) {
                searchQueries.push(`${normalizedAddress}, ${normalizedDistrict}, ${normalizedCity}`);
            }
            
            if (normalizedCity) searchQueries.push(normalizedCity);

            const coords = await this.fetchCoordinatesFromAddress(searchQueries);
            if (coords) {
                finalLat = coords.lat;
                finalLon = coords.lon;
            }
        }

        const fallbackCity = normalizedCity || '';
        const fallbackDistrict = normalizedDistrict || '';
        const fallbackWard = normalizedWard || '';

        const createdHouse = await this.prisma.house.create({
            data: {
                original_id: data.original_id || Math.random().toString(36).substring(7),
                name: data.name,
                address: normalizedAddress,
                ward: fallbackWard,
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

        // Log House Creation
        if (actorId) {
            await this.activityLogService.log(
                actorId,
                'property_created',
                `Created property: ${populatedHouse.name}`,
                { houseId: populatedHouse.id } as any
            );
        }

        // Trigger Fraud Detection
        this.monitoringService.detectPropertyFraud(populatedHouse.id).catch(err => {
            console.error('Fraud detection failed', err);
        });

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

        const updated = await this.prisma.house.update({
            where: { id },
            data: { status }
        });

        if (actorId) {
            await this.activityLogService.log(
                actorId,
                'property_updated',
                `Changed status of property ${updated.name} to ${status}`,
                { houseId: id, status } as any
            );
        }

        return updated;
    }

    async removeHouse(id: string, actorId?: string, actorRole?: string) {
        const house = await this.prisma.house.findUnique({
            where: { id }
        });
        if (!house) throw new Error('House not found');
        await this.assertUserCanManageHouse(id, actorId, actorRole);

        const updated = await this.prisma.house.update({
            where: { id },
            data: { deleted_at: new Date() }
        });

        if (actorId) {
            await this.activityLogService.log(
                actorId,
                'property_deleted',
                `Deleted property: ${updated.name}`,
                { houseId: id } as any
            );
        }

        return updated;
    }
}
