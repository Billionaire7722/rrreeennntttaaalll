import { CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
export declare class AbnormalActivityGuard implements CanActivate {
    private prisma;
    private actionLog;
    private readonly WINDOW_MS;
    private readonly MAX_ACTIONS;
    constructor(prisma: PrismaService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
