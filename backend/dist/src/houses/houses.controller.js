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
exports.HousesController = void 0;
const common_1 = require("@nestjs/common");
const houses_service_1 = require("./houses.service");
const common_2 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../security/roles.guard");
const roles_decorator_1 = require("../security/roles.decorator");
const roles_enum_1 = require("../security/roles.enum");
const common_3 = require("@nestjs/common");
const audit_interceptor_1 = require("../audit/audit.interceptor");
const jwt_1 = require("@nestjs/jwt");
let HousesController = class HousesController {
    housesService;
    jwtService;
    constructor(housesService, jwtService) {
        this.housesService = housesService;
        this.jwtService = jwtService;
    }
    getUserRoleFromRequest(req) {
        try {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                const decoded = this.jwtService.decode(token);
                return decoded?.role || null;
            }
        }
        catch (e) {
        }
        return null;
    }
    async getHouses(skip, take, req) {
        const skipNum = skip ? parseInt(skip, 10) : 0;
        const takeNum = take ? parseInt(take, 10) : 10;
        const role = this.getUserRoleFromRequest(req);
        const isAdmin = role === roles_enum_1.Role.ADMIN || role === roles_enum_1.Role.SUPER_ADMIN;
        const result = await this.housesService.getHouses(Number.isNaN(skipNum) ? 0 : skipNum, Number.isNaN(takeNum) ? 10 : takeNum);
        if (!isAdmin && result && result.data) {
            result.data.forEach((h) => delete h.contact_phone);
        }
        return result;
    }
    async getHouseById(id, req) {
        const house = await this.housesService.getHouseById(id);
        if (house) {
            const role = this.getUserRoleFromRequest(req);
            const isAdmin = role === roles_enum_1.Role.ADMIN || role === roles_enum_1.Role.SUPER_ADMIN;
            if (!isAdmin) {
                delete house.contact_phone;
            }
        }
        return house;
    }
    async createHouse(data, req) {
        return this.housesService.createHouse(data, req.user?.userId, req.user?.role);
    }
    async updateHouse(id, data, req) {
        return this.housesService.updateHouse(id, data, req.user?.userId, req.user?.role);
    }
    async updateStatus(id, status) {
        return this.housesService.updateStatus(id, status);
    }
    async removeHouse(id) {
        return this.housesService.removeHouse(id);
    }
};
exports.HousesController = HousesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('skip')),
    __param(1, (0, common_1.Query)('take')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], HousesController.prototype, "getHouses", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], HousesController.prototype, "getHouseById", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_2.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.ADMIN, roles_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], HousesController.prototype, "createHouse", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_2.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.ADMIN, roles_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], HousesController.prototype, "updateHouse", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, common_2.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.ADMIN, roles_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], HousesController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_2.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.ADMIN, roles_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HousesController.prototype, "removeHouse", null);
exports.HousesController = HousesController = __decorate([
    (0, common_1.Controller)('houses'),
    (0, common_3.UseInterceptors)(audit_interceptor_1.AuditInterceptor),
    __metadata("design:paramtypes", [houses_service_1.HousesService,
        jwt_1.JwtService])
], HousesController);
//# sourceMappingURL=houses.controller.js.map