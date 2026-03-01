import { Module } from '@nestjs/common';
import { HousesController } from './houses.controller';
import { HousesService } from './houses.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Module({
    imports: [PrismaModule, AuditModule],
    controllers: [HousesController],
    providers: [HousesService, AuditInterceptor],
})
export class HousesModule { }
