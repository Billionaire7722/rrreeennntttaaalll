import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
export declare class HealthController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getApiRoot(res: Response): Response<any, Record<string, any>>;
    getHealth(res: Response): Promise<Response<any, Record<string, any>>>;
}
