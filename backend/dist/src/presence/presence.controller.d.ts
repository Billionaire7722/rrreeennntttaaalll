import type { Request } from 'express';
import { PresenceService } from './presence.service';
export declare class PresenceController {
    private readonly presenceService;
    constructor(presenceService: PresenceService);
    heartbeat(req: Request): {
        ok: boolean;
    };
    offline(body: {
        userId?: string;
    }, req: Request): {
        ok: boolean;
    };
}
