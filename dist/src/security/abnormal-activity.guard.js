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
exports.AbnormalActivityGuard = void 0;
const common_1 = require("@nestjs/common");
const roles_enum_1 = require("./roles.enum");
const prisma_service_1 = require("../prisma/prisma.service");
let AbnormalActivityGuard = class AbnormalActivityGuard {
    prisma;
    actionLog = new Map();
    WINDOW_MS = 60 * 1000;
    MAX_ACTIONS = 10;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const { user, method } = req;
        if (method !== 'DELETE' && method !== 'PATCH' && method !== 'POST') {
            return true;
        }
        if (!user || user.role !== roles_enum_1.Role.ADMIN) {
            return true;
        }
        const now = Date.now();
        const userId = user.userId;
        if (!this.actionLog.has(userId)) {
            this.actionLog.set(userId, []);
        }
        const timestamps = this.actionLog.get(userId);
        const recentTimestamps = timestamps.filter(t => now - t < this.WINDOW_MS);
        if (recentTimestamps.length >= this.MAX_ACTIONS) {
            const lockDurationMs = 15 * 60 * 1000;
            const lockedUntil = new Date(now + lockDurationMs);
            await this.prisma.user.update({
                where: { id: userId },
                data: { locked_until: lockedUntil }
            });
            await this.prisma.auditLog.create({
                data: {
                    actorId: userId,
                    actorRole: user.role,
                    actionType: 'ACCOUNT_LOCKED_ABNORMAL_ACTIVITY',
                    entityType: 'User',
                    entityId: userId,
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'] || 'Unknown',
                    beforeData: JSON.stringify({ timestamps: recentTimestamps }),
                }
            });
            this.actionLog.delete(userId);
            throw new common_1.ForbiddenException(`Abnormal activity detected. Account locked until ${lockedUntil.toISOString()}`);
        }
        recentTimestamps.push(now);
        this.actionLog.set(userId, recentTimestamps);
        return true;
    }
};
exports.AbnormalActivityGuard = AbnormalActivityGuard;
exports.AbnormalActivityGuard = AbnormalActivityGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => prisma_service_1.PrismaService))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AbnormalActivityGuard);
//# sourceMappingURL=abnormal-activity.guard.js.map