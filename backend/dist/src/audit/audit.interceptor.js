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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const audit_service_1 = require("./audit.service");
let AuditInterceptor = class AuditInterceptor {
    auditService;
    constructor(auditService) {
        this.auditService = auditService;
    }
    intercept(context, next) {
        const req = context.switchToHttp().getRequest();
        const { method, url, body, user, ip } = req;
        if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
            const userAgent = req.headers['user-agent'] || 'Unknown';
            const actorId = user?.userId || user?.id;
            const actorRole = user?.role;
            const urlParts = url.split('?')[0].split('/').filter(Boolean);
            const entityType = urlParts[0] || 'Unknown';
            let entityId = 'N/A';
            if (urlParts.length > 1 && urlParts[1] !== 'status' && urlParts[1] !== 'role' && urlParts[1] !== 'toggle') {
                entityId = urlParts[1];
            }
            else if (body && body.id) {
                entityId = body.id;
            }
            else if (body && body.houseId) {
                entityId = body.houseId;
            }
            let actionType = `${method}_${entityType.toUpperCase()}`;
            if (urlParts.includes('status'))
                actionType += '_STATUS';
            if (urlParts.includes('role'))
                actionType += '_ROLE';
            if (urlParts.includes('restore'))
                actionType = `RESTORE_${entityType.toUpperCase()}`;
            return next.handle().pipe((0, operators_1.tap)((afterData) => {
                this.auditService.logAction({
                    actorId,
                    actorRole,
                    actionType,
                    entityType,
                    entityId,
                    afterData: method !== 'DELETE' ? body : null,
                    ipAddress: ip,
                    userAgent
                });
            }));
        }
        return next.handle();
    }
};
exports.AuditInterceptor = AuditInterceptor;
exports.AuditInterceptor = AuditInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [audit_service_1.AuditService])
], AuditInterceptor);
//# sourceMappingURL=audit.interceptor.js.map