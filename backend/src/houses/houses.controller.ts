import { Controller, Get, Query, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { HousesService } from './houses.service';

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
    async createHouse(@Body() data: any) {
        return this.housesService.createHouse(data);
    }

    @Patch(':id')
    async updateHouse(
        @Param('id') id: string,
        @Body() data: any
    ) {
        return this.housesService.updateHouse(id, data);
    }

    @Patch(':id/status')
    async updateStatus(
        @Param('id') id: string,
        @Body('status') status: string
    ) {
        return this.housesService.updateStatus(id, status);
    }

    @Delete(':id')
    async removeHouse(@Param('id') id: string) {
        return this.housesService.removeHouse(id);
    }
}
