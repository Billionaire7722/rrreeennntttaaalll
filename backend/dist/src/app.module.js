"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const bullmq_1 = require("@nestjs/bullmq");
const throttler_1 = require("@nestjs/throttler");
const nestjs_prometheus_1 = require("@willsoto/nestjs-prometheus");
const redisStore = __importStar(require("cache-manager-redis-store"));
const prisma_module_1 = require("./prisma/prisma.module");
const health_module_1 = require("./health/health.module");
const security_middleware_1 = require("./common/middleware/security.middleware");
const logging_middleware_1 = require("./common/middleware/logging.middleware");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const houses_module_1 = require("./houses/houses.module");
const admin_module_1 = require("./admin/admin.module");
const audit_module_1 = require("./audit/audit.module");
const cloudinary_module_1 = require("./cloudinary/cloudinary.module");
const upload_module_1 = require("./upload/upload.module");
const presence_module_1 = require("./presence/presence.module");
const messages_module_1 = require("./messages/messages.module");
const support_module_1 = require("./support/support.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(security_middleware_1.SecurityMiddleware, logging_middleware_1.LoggingMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            nestjs_prometheus_1.PrometheusModule.register({ defaultMetrics: { enabled: true } }),
            bullmq_1.BullModule.forRoot({
                connection: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT || '6379'),
                },
            }),
            throttler_1.ThrottlerModule.forRoot([{
                    name: 'global',
                    ttl: 60,
                    limit: 100,
                }, {
                    name: 'login',
                    ttl: 60,
                    limit: 5,
                }]),
            cache_manager_1.CacheModule.register({
                isGlobal: true,
                store: redisStore,
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
            }),
            prisma_module_1.PrismaModule,
            health_module_1.HealthModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            houses_module_1.HousesModule,
            admin_module_1.AdminModule,
            audit_module_1.AuditModule,
            cloudinary_module_1.CloudinaryModule,
            upload_module_1.UploadModule,
            presence_module_1.PresenceModule,
            messages_module_1.MessagesModule,
            support_module_1.SupportModule
        ],
        controllers: [],
        providers: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map