import { Controller, Get, Query, Post, Body, Patch, Param, Delete, Request } from '@nestjs/common';
import { HousesService } from './houses.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../security/roles.guard';
import { Roles } from '../security/roles.decorator';
import { Role } from '../security/roles.enum';
import { UseInterceptors } from '@nestjs/common';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { JwtService } from '@nestjs/jwt'; // Added JwtService import

@Controller('houses')
@UseInterceptors(AuditInterceptor)
export class HousesController {
    constructor(
        private readonly housesService: HousesService,
        private readonly jwtService: JwtService // Added JwtService to constructor
    ) { }

    // Added getUserRoleFromRequest method
    private getUserRoleFromRequest(req: any): string | null {
        try {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                const decoded = this.jwtService.decode(token) as any;
                return decoded?.role || null;
            }
        } catch (e) {
            // Ignore decoding errors
        }
        return null;
    }

    @Get()
    async getHouses(
        @Query('skip') skip?: string,
        @Query('take') take?: string,
        @Request() req?: any // Added @Request() req
    ) {
        const skipNum = skip ? parseInt(skip, 10) : 0;
        const takeNum = take ? parseInt(take, 10) : 10;

        // Added logic to check user role and strip contact_phone
        const role = this.getUserRoleFromRequest(req);
        const isAdmin = role === Role.ADMIN || role === Role.SUPER_ADMIN;

        const result = await this.housesService.getHouses(
            Number.isNaN(skipNum) ? 0 : skipNum,
            Number.isNaN(takeNum) ? 10 : takeNum
        );

        if (!isAdmin && result && result.data) {
            result.data.forEach((h: any) => delete h.contact_phone);
        }
        return result;
    }

    @Get(':id')
    async getHouseById(@Param('id') id: string, @Request() req: any) { // Added @Request() req
        const house = await this.housesService.getHouseById(id);
        if (house) {
            // Added logic to check user role and strip contact_phone
            const role = this.getUserRoleFromRequest(req);
            const isAdmin = role === Role.ADMIN || role === Role.SUPER_ADMIN;
            if (!isAdmin) {
                delete (house as any).contact_phone;
            }
        }
        return house;
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    async createHouse(@Body() data: any, @Request() req) {
        return this.housesService.createHouse(data, req.user?.userId, req.user?.role);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    async updateHouse(
        @Param('id') id: string,
        @Body() data: any,
        @Request() req
    ) {
        return this.housesService.updateHouse(id, data, req.user?.userId, req.user?.role);
    }

    @Patch(':id/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    async updateStatus(
        @Param('id') id: string,
        @Body('status') status: string
    ) {
        return this.housesService.updateStatus(id, status);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    async removeHouse(@Param('id') id: string) {
        return this.housesService.removeHouse(id);
    }
}
