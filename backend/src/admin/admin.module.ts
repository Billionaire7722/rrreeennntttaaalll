import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { PresenceModule } from '../presence/presence.module';
import { ActivityLogService } from './activity-log.service';

@Module({
    imports: [PrismaModule, AuditModule, PresenceModule],
    controllers: [AdminController, MonitoringController],
    providers: [AdminService, MonitoringService, ActivityLogService],
    exports: [AdminService, MonitoringService, ActivityLogService]
})
export class AdminModule { }
