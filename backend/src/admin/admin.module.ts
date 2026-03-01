import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { PresenceModule } from '../presence/presence.module';

@Module({
    imports: [PrismaModule, AuditModule, PresenceModule],
    controllers: [AdminController],
    providers: [AdminService],
})
export class AdminModule { }
