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
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let HealthController = class HealthController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    getApiRoot(res) {
        const uptimeSeconds = process.uptime();
        const env = process.env.NODE_ENV || 'development';
        return res.status(200).json({
            serviceName: 'Rental API',
            version: '1.0.0',
            environment: env,
            uptime: uptimeSeconds,
            currentServerTime: new Date().toISOString(),
            description: 'The core backend API for the Rental platform. Provides property management and user data functionality.'
        });
    }
    async getHealth(res) {
        let databaseStatus = 'disconnected';
        let statusCode = 503;
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            databaseStatus = 'connected';
            statusCode = 200;
        }
        catch (error) {
            console.error("Health check database ping failed:", error);
            databaseStatus = 'disconnected';
        }
        return res.status(statusCode).json({
            serverStatus: 'connected',
            databaseStatus,
            timestamp: new Date().toISOString(),
        });
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "getApiRoot", null);
__decorate([
    (0, common_1.Get)('health'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getHealth", null);
exports.HealthController = HealthController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HealthController);
//# sourceMappingURL=health.controller.js.map