import { Controller, Get, Query, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { HousesService } from './houses.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../security/roles.guard';
import { Roles } from '../security/roles.decorator';
import { Role } from '../security/roles.enum';

@Controller('houses')
export class HousesController {
    constructor(private readonly housesService: HousesService) { }

    @Get()
    async getHouses(
        @Query('skip') skip?: string,
        @Query('take') take?: string
    ) {
        const skipNum = skip ? parseInt(skip, 10) : 0;
        const takeNum = take ? parseInt(take, 10) : 10;

        return this.housesService.getHouses(
            Number.isNaN(skipNum) ? 0 : skipNum,
            Number.isNaN(takeNum) ? 10 : takeNum
        );
    }

    @Get(':id')
    async getHouseById(@Param('id') id: string) {
        return this.housesService.getHouseById(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    async createHouse(@Body() data: any) {
        return this.housesService.createHouse(data);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    async updateHouse(
        @Param('id') id: string,
        @Body() data: any
    ) {
        return this.housesService.updateHouse(id, data);
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
