import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import * as redisStore from 'cache-manager-redis-store';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { SecurityMiddleware } from './common/middleware/security.middleware';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HousesModule } from './houses/houses.module';
import { AdminModule } from './admin/admin.module';
import { AuditModule } from './audit/audit.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { UploadModule } from './upload/upload.module';
import { PresenceModule } from './presence/presence.module';
import { MessagesModule } from './messages/messages.module';
import { SupportModule } from './support/support.module';

@Module({
  imports: [
    PrometheusModule.register({ defaultMetrics: { enabled: true } }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    ThrottlerModule.forRoot([{
      name: 'global',
      ttl: 60000,
      limit: 100,
    }, {
      name: 'login',
      ttl: 60000,
      limit: 5,
    }]),
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    HousesModule,
    AdminModule,
    AuditModule,
    CloudinaryModule,
    UploadModule,
    PresenceModule,
    MessagesModule,
    SupportModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecurityMiddleware, LoggingMiddleware).forRoutes('*');
  }
}
