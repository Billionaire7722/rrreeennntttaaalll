"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("./admin.service");
const audit_service_1 = require("../audit/audit.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../security/roles.guard");
const roles_decorator_1 = require("../security/roles.decorator");
const roles_enum_1 = require("../security/roles.enum");
let AdminController = class AdminController {
    adminService;
    auditService;
    constructor(adminService, auditService) {
        this.adminService = adminService;
        this.auditService = auditService;
    }
    async getUsers(skip, take, search, status) {
        return this.adminService.getAllUsers(skip, take, search, status);
    }
    async getAdmins(skip, take) {
        return this.adminService.getAllAdmins(skip, take);
    }
    async changeMyPassword(req, body) {
        return this.adminService.changeMyPassword(req.user.userId, body.currentPassword, body.newPassword);
    }
    async createAdmin(body) {
        return this.adminService.createAdmin(body);
    }
    async createUser(body) {
        return this.adminService.createUser(body);
    }
    async updateAdminInfo(id, body) {
        return this.adminService.updateAdmin(id, body);
    }
    async changeAdminRole(id, role) {
        return this.adminService.changeRole(id, role);
    }
    async changeAdminStatus(id, status) {
        return this.adminService.changeStatus(id, status);
    }
    async deleteAdmin(id) {
        return this.adminService.softDeleteAdmin(id);
    }
    async restoreUser(id) {
        return this.adminService.restoreUser(id);
    }
    async restoreHouse(id) {
        return this.adminService.restoreHouse(id);
    }
    async getAuditLogs(skip, take, adminId, actionType) {
        return this.auditService.getLogs({ skip, take, adminId, actionType });
    }
    async getLoginLogs(skip, take, status) {
        return this.adminService.getLoginLogs(skip, take, status);
    }
    async getSystemMetrics() {
        return this.adminService.getSystemMetrics();
    }
    async getLiveSessions(skip, take, role) {
        return this.adminService.getLiveSessions(skip, take, role);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('users'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Query)('skip')),
    __param(1, (0, common_1.Query)('take')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Get)('admins'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Query)('skip')),
    __param(1, (0, common_1.Query)('take')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAdmins", null);
__decorate([
    (0, common_1.Patch)('me/password'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "changeMyPassword", null);
__decorate([
    (0, common_1.Post)('admins'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createAdmin", null);
__decorate([
    (0, common_1.Post)('users'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createUser", null);
__decorate([
    (0, common_1.Patch)('admins/:id'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateAdminInfo", null);
__decorate([
    (0, common_1.Patch)('admins/:id/role'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "changeAdminRole", null);
__decorate([
    (0, common_1.Patch)('admins/:id/status'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "changeAdminStatus", null);
__decorate([
    (0, common_1.Delete)('admins/:id'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteAdmin", null);
__decorate([
    (0, common_1.Post)('users/:id/restore'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "restoreUser", null);
__decorate([
    (0, common_1.Post)('houses/:id/restore'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "restoreHouse", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Query)('skip')),
    __param(1, (0, common_1.Query)('take')),
    __param(2, (0, common_1.Query)('adminId')),
    __param(3, (0, common_1.Query)('actionType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAuditLogs", null);
__decorate([
    (0, common_1.Get)('login-logs'),
    __param(0, (0, common_1.Query)('skip')),
    __param(1, (0, common_1.Query)('take')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getLoginLogs", null);
__decorate([
    (0, common_1.Get)('metrics'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSystemMetrics", null);
__decorate([
    (0, common_1.Get)('live-sessions'),
    __param(0, (0, common_1.Query)('skip')),
    __param(1, (0, common_1.Query)('take')),
    __param(2, (0, common_1.Query)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getLiveSessions", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.SUPER_ADMIN),
    __metadata("design:paramtypes", [admin_service_1.AdminService,
        audit_service_1.AuditService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map