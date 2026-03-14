import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../security/roles.guard';
import { Roles } from '../security/roles.decorator';
import { Role } from '../security/roles.enum';
import { SystemService } from './system.service';

@Controller('admin/system')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class SystemController {
    constructor(private readonly systemService: SystemService) {}

    @Get('status')
    async getStatus() {
        return this.systemService.getStatus();
    }

    @Post('action')
    async runAction(@Body() body: { action: string; target?: string; confirm?: string }) {
        return this.systemService.runAction(body.action as any, body.target, body.confirm);
    }
}
