import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../security/roles.enum';
import { ActivityLogService } from '../admin/activity-log.service';
import { MonitoringService } from '../admin/monitoring.service';

type NormalizedRoomDetails = {
    electricityPrice: number | null;
    waterPrice: number | null;
    paymentMethod: string | null;
    otherFees: string | null;
};

@Injectable()
export class HousesService {

    constructor(
        private prisma: PrismaService,
        private activityLogService: ActivityLogService,
        private monitoringService: MonitoringService
    ) { }

    private normalizeOptionalNumber(value: unknown): number | null {
        if (value === undefined || value === null || value === '') return null;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    private normalizeOptionalString(value: unknown): string | null {
        if (value === undefined || value === null) return null;
        const normalized = String(value).trim();
        return normalized ? normalized : null;
    }

    private isRoomMiniApartment(value: unknown): boolean {
        const normalized = String(value || '')
            .trim()
            .toLowerCase()
            .replace(/[-\s]+/g, '_');

        return normalized === 'room/mini_apartment' || normalized === 'room_mini_apartment';
    }

    private normalizeRoomDetails(value: unknown): NormalizedRoomDetails {
        const details = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

        return {
            electricityPrice: this.normalizeOptionalNumber(details.electricityPrice),
            waterPrice: this.normalizeOptionalNumber(details.waterPrice),
            paymentMethod: this.normalizeOptionalString(details.paymentMethod),
            otherFees: this.normalizeOptionalString(details.otherFees),
        };
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
                { ward: { contains: search, mode: 'insensitive' } },
                { district: { contains: search, mode: 'insensitive' } },
                { ward_code: { contains: search, mode: 'insensitive' } },
                { city: { contains: search, mode: 'insensitive' } },
                { city_code: { contains: search, mode: 'insensitive' } },
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
                    ward_code: true,
                    district: true,
                    city: true,
                    city_code: true,
                    property_type: true,
                    price: true,
                    payment_method: true,
                    bedrooms: true,
                    floors: true,
                    toilets: true,
                    square: true,
                    description: true,
                    contact_phone: true,
                    image_url_1: true,
                    image_url_2: true,
                    image_url_3: true,
                    image_url_4: true,
                    image_url_5: true,
                    image_url_6: true,
                    image_url_7: true,
                    video_url_1: true,
                    video_url_2: true,
                    status: true,
                    is_private_bathroom: true,
                    latitude: true,
                    longitude: true,
                    deleted_at: true,
                    roomDetails: {
                        select: {
                            electricityPrice: true,
                            waterPrice: true,
                            paymentMethod: true,
                            otherFees: true,
                        }
                    },
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
                roomDetails: true,
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
        const normalizedDistrict = String(data.district ?? '').trim();
        const normalizedCity = String(data.city || house.city || '').trim();
        const normalizedWardCode = this.normalizeOptionalString(data.ward_code);
        const normalizedCityCode = this.normalizeOptionalString(data.city_code);
        const nextPropertyType = data.property_type !== undefined ? data.property_type : house.property_type;
        const shouldHaveRoomDetails = this.isRoomMiniApartment(nextPropertyType);
        const shouldSyncRoomDetails = shouldHaveRoomDetails && (data.roomDetails !== undefined || data.property_type !== undefined);
        const normalizedRoomDetails = this.normalizeRoomDetails(data.roomDetails);

        if ((data.latitude === undefined || data.longitude === undefined) &&
            (data.address !== undefined || data.ward !== undefined || data.city !== undefined)) {
            
            const searchQueries: string[] = [];
            if (normalizedAddress && normalizedWard && normalizedCity) {
                searchQueries.push(`${normalizedAddress}, ${normalizedWard}, ${normalizedCity}, Vietnam`);
            }
            if (normalizedWard && normalizedCity) {
                searchQueries.push(`${normalizedWard}, ${normalizedCity}, Vietnam`);
            }
            if (normalizedCity) searchQueries.push(`${normalizedCity}, Vietnam`);

            const coords = await this.fetchCoordinatesFromAddress(searchQueries);
            if (coords) {
                finalLat = coords.lat;
                finalLon = coords.lon;
            }
        }

        const houseUpdateData: any = {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.property_type !== undefined && { property_type: data.property_type }),
            ...(data.address !== undefined && { address: data.address }),
            ...(data.ward !== undefined && { ward: data.ward }),
            ...(data.ward_code !== undefined && { ward_code: normalizedWardCode }),
            ...(data.city !== undefined && { city: data.city }),
            ...(data.city_code !== undefined && { city_code: normalizedCityCode }),
            ...((data.address !== undefined || data.ward !== undefined || data.city !== undefined || data.district !== undefined) && {
                district: normalizedDistrict || null,
            }),
            ...(data.price !== undefined && { price: this.normalizeOptionalNumber(data.price) }),
            ...(data.bedrooms !== undefined && { bedrooms: this.normalizeOptionalNumber(data.bedrooms) }),
            ...(data.floors !== undefined && { floors: this.normalizeOptionalNumber(data.floors) }),
            ...(data.toilets !== undefined && { toilets: this.normalizeOptionalNumber(data.toilets) }),
            ...(data.square !== undefined && { square: this.normalizeOptionalNumber(data.square) }),
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
            ...(shouldSyncRoomDetails && { payment_method: normalizedRoomDetails.paymentMethod }),
            ...(data.property_type !== undefined && !shouldHaveRoomDetails && { payment_method: null }),
        };

        await this.prisma.$transaction(async (tx) => {
            await tx.house.update({
                where: { id },
                data: houseUpdateData,
            });

            if (shouldSyncRoomDetails) {
                await tx.houseRoomDetail.upsert({
                    where: { houseId: id },
                    update: normalizedRoomDetails,
                    create: {
                        houseId: id,
                        ...normalizedRoomDetails,
                    },
                });
            }

            if (data.property_type !== undefined && !shouldHaveRoomDetails) {
                await tx.houseRoomDetail.deleteMany({
                    where: { houseId: id },
                });
            }
        });

        const refreshedHouse = await prismaAny.house.findFirst({
            where: { id, deleted_at: null },
            include: {
                roomDetails: true,
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
        const normalizedDistrict = this.normalizeOptionalString(data.district);
        const normalizedCity = String(data.city || '').trim();
        const normalizedWardCode = this.normalizeOptionalString(data.ward_code);
        const normalizedCityCode = this.normalizeOptionalString(data.city_code);

        if (finalLat === null || finalLon === null) {
            const searchQueries: string[] = [];
            if (normalizedAddress && normalizedWard && normalizedCity) {
                searchQueries.push(`${normalizedAddress}, ${normalizedWard}, ${normalizedCity}, Vietnam`);
            }
            
            if (normalizedWard && normalizedCity) {
                searchQueries.push(`${normalizedWard}, ${normalizedCity}, Vietnam`);
            }
            if (normalizedCity) searchQueries.push(`${normalizedCity}, Vietnam`);

            const coords = await this.fetchCoordinatesFromAddress(searchQueries);
            if (coords) {
                finalLat = coords.lat;
                finalLon = coords.lon;
            }
        }

        const fallbackCity = normalizedCity || '';
        const fallbackWard = normalizedWard || '';
        const propertyType = this.normalizeOptionalString(data.property_type);
        const shouldCreateRoomDetails = this.isRoomMiniApartment(propertyType);
        const normalizedRoomDetails = this.normalizeRoomDetails(data.roomDetails);

        const createdHouse = await this.prisma.house.create({
            data: {
                original_id: data.original_id || Math.random().toString(36).substring(7),
                name: data.name,
                address: normalizedAddress,
                ward: fallbackWard,
                ward_code: normalizedWardCode,
                latitude: finalLat,
                longitude: finalLon,
                price: this.normalizeOptionalNumber(data.price),
                bedrooms: this.normalizeOptionalNumber(data.bedrooms),
                floors: this.normalizeOptionalNumber(data.floors),
                toilets: this.normalizeOptionalNumber(data.toilets),
                square: this.normalizeOptionalNumber(data.square),
                description: data.description,
                contact_phone: data.contact_phone,
                is_private_bathroom: data.is_private_bathroom,
                status: data.status || 'available',
                city: fallbackCity,
                city_code: normalizedCityCode,
                district: normalizedDistrict,
                property_type: propertyType,
                payment_method: shouldCreateRoomDetails ? normalizedRoomDetails.paymentMethod : this.normalizeOptionalString(data.payment_method),
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
                ...(shouldCreateRoomDetails
                    ? {
                        roomDetails: {
                            create: normalizedRoomDetails,
                        },
                    }
                    : {}),
            }
        });

        const populatedHouse = await prismaAny.house.findFirst({
            where: { id: createdHouse.id, deleted_at: null },
            include: {
                roomDetails: true,
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
