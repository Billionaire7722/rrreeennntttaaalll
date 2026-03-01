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
exports.PresenceController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const presence_service_1 = require("./presence.service");
let PresenceController = class PresenceController {
    presenceService;
    constructor(presenceService) {
        this.presenceService = presenceService;
    }
    heartbeat(req) {
        const user = req.user;
        this.presenceService.heartbeat({
            userId: user.userId,
            role: user.role,
            username: user.username,
            name: user.name,
            email: user.email,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] || 'Unknown',
        });
        return { ok: true };
    }
    offline(body, req) {
        const user = req.user;
        const targetUserId = body?.userId || user.userId;
        this.presenceService.markOffline(targetUserId);
        return { ok: true };
    }
};
exports.PresenceController = PresenceController;
__decorate([
    (0, common_1.Post)('heartbeat'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PresenceController.prototype, "heartbeat", null);
__decorate([
    (0, common_1.Post)('offline'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PresenceController.prototype, "offline", null);
exports.PresenceController = PresenceController = __decorate([
    (0, common_1.Controller)('presence'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [presence_service_1.PresenceService])
], PresenceController);
//# sourceMappingURL=presence.controller.js.map