import { Controller, Get, Patch, Delete, Post, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { Public } from '../security/public.decorator';
import { AdminService } from './admin.service';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../security/roles.guard';
import { Roles } from '../security/roles.decorator';
import { Role } from '../security/roles.enum';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN) // Universally protect this controller
export class AdminController {
    constructor(
        private readonly adminService: AdminService,
        private readonly auditService: AuditService
    ) { }

    @Get('users')
    @Roles(Role.SUPER_ADMIN)
    async getUsers(
        @Query('skip') skip?: number,
        @Query('take') take?: number,
        @Query('search') search?: string,
        @Query('status') status?: string,
    ) {
        return this.adminService.getAllUsers(skip, take, search, status);
    }

    @Get('admins')
    @Roles(Role.SUPER_ADMIN)
    async getAdmins(@Query('skip') skip?: number, @Query('take') take?: number) {
        return this.adminService.getAllAdmins(skip, take);
    }

    @Patch('me/password')
    async changeMyPassword(
        @Request() req,
        @Body() body: { currentPassword: string; newPassword: string }
    ) {
        return this.adminService.changeMyPassword(req.user.userId, body.currentPassword, body.newPassword);
    }

    @Post('admins')
    @Roles(Role.SUPER_ADMIN)
    async createAdmin(@Body() body: any) {
        return this.adminService.createAdmin(body);
    }

    @Post('users')
    @Roles(Role.SUPER_ADMIN)
    async createUser(@Body() body: any) {
        return this.adminService.createUser(body);
    }

    @Patch('admins/:id')
    @Roles(Role.SUPER_ADMIN)
    async updateAdminInfo(@Param('id') id: string, @Body() body: any) {
        return this.adminService.updateAdmin(id, body);
    }

    @Patch('admins/:id/role')
    @Roles(Role.SUPER_ADMIN)
    async changeAdminRole(
        @Param('id') id: string,
        @Body('role') role: Role
    ) {
        return this.adminService.changeRole(id, role);
    }

    @Patch('admins/:id/status')
    @Roles(Role.SUPER_ADMIN)
    async changeAdminStatus(
        @Param('id') id: string,
        @Body('status') status: string
    ) {
        return this.adminService.changeStatus(id, status);
    }

    @Delete('admins/:id')
    @Roles(Role.SUPER_ADMIN)
    async deleteAdmin(@Param('id') id: string) {
        return this.adminService.softDeleteAdmin(id);
    }

    @Post('users/:id/restore')
    @Roles(Role.SUPER_ADMIN)
    async restoreUser(@Param('id') id: string) {
        return this.adminService.restoreUser(id);
    }

    @Post('houses/:id/restore')
    @Roles(Role.SUPER_ADMIN)
    async restoreHouse(@Param('id') id: string) {
        return this.adminService.restoreHouse(id);
    }

    @Get('audit-logs')
    @Roles(Role.SUPER_ADMIN)
    async getAuditLogs(
        @Query('skip') skip?: number,
        @Query('take') take?: number,
        @Query('adminId') adminId?: string,
        @Query('actionType') actionType?: string,
    ) {
        return this.auditService.getLogs({ skip, take, adminId, actionType });
    }

    @Get('login-logs')
    async getLoginLogs(
        @Query('skip') skip?: number,
        @Query('take') take?: number,
        @Query('status') status?: string
    ) {
        return this.adminService.getLoginLogs(skip, take, status);
    }

    @Get('metrics')
    async getSystemMetrics() {
        return this.adminService.getSystemMetrics();
    }

    @Get('live-sessions')
    async getLiveSessions(
        @Query('skip') skip?: number,
        @Query('take') take?: number,
        @Query('role') role?: string
    ) {
        return this.adminService.getLiveSessions(skip, take, role);
    }
}
