import { Controller, Get, Query, Post, Body, Patch, Param, Delete, Request } from '@nestjs/common';
import { HousesService } from './houses.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../security/roles.guard';
import { Roles } from '../security/roles.decorator';
import { Role } from '../security/roles.enum';
import { UseInterceptors } from '@nestjs/common';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { JwtService } from '@nestjs/jwt';

@Controller('houses')
@UseInterceptors(AuditInterceptor)
export class HousesController {
    constructor(
        private readonly housesService: HousesService,
        private readonly jwtService: JwtService
    ) { }

    private getUserFromRequest(req: any): { role: string | null; userId: string | null } {
        try {
            const authHeader = req?.headers?.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                const decoded = this.jwtService.verify(token, {
                    secret: process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production',
                }) as any;
                return { role: decoded?.role || null, userId: decoded?.sub || null };
            }
        } catch (e) {
            // Ignore invalid/expired token on public endpoint
        }
        return { role: null, userId: null };
    }

    @Get()
    async getHouses(
        @Query('skip') skip?: string,
        @Query('take') take?: string,
        @Request() req?: any
    ) {
        try {
            const skipNum = skip ? parseInt(skip, 10) : 0;
            const takeNum = take ? parseInt(take, 10) : 10;

            const { role, userId } = this.getUserFromRequest(req);
            const isAdmin = role === Role.SUPER_ADMIN;

            const result = await this.housesService.getHouses(
                Number.isNaN(skipNum) ? 0 : skipNum,
                Number.isNaN(takeNum) ? 10 : takeNum,
                undefined
            );

            if (!isAdmin && result && result.data) {
                result.data.forEach((h: any) => delete h.contact_phone);
            }
            return result;
        } catch (e) {
            console.error("GET HOUSES ERROR:", e);
            throw e;
        }
    }

    @Get('me')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.USER, Role.SUPER_ADMIN)
    async getMyHouses(@Request() req: any) {
        return this.housesService.getHouses(0, 100, req.user?.userId);
    }

    @Get(':id')
    async getHouseById(@Param('id') id: string, @Request() req: any) {
        const { role, userId } = this.getUserFromRequest(req);
        const house = await this.housesService.getHouseById(id, undefined);
        if (house) {
            const isAdmin = role === Role.SUPER_ADMIN;
            if (!isAdmin) {
                delete (house as any).contact_phone;
            }
        }
        return house;
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.USER, Role.SUPER_ADMIN)
    async createHouse(@Body() data: any, @Request() req) {
        return this.housesService.createHouse(data, req.user?.userId, req.user?.role);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.USER, Role.SUPER_ADMIN)
    async updateHouse(
        @Param('id') id: string,
        @Body() data: any,
        @Request() req
    ) {
        return this.housesService.updateHouse(id, data, req.user?.userId, req.user?.role);
    }

    @Patch(':id/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.USER, Role.SUPER_ADMIN)
    async updateStatus(
        @Param('id') id: string,
        @Body('status') status: string,
        @Request() req: any
    ) {
        return this.housesService.updateStatus(id, status, req.user?.userId, req.user?.role);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.USER, Role.SUPER_ADMIN)
    async removeHouse(@Param('id') id: string, @Request() req: any) {
        return this.housesService.removeHouse(id, req.user?.userId, req.user?.role);
    }
}
