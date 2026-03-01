import { Injectable } from '@nestjs/common';

type PresenceEntry = {
    userId: string;
    role: string;
    username?: string;
    name?: string;
    email?: string;
    ipAddress?: string;
    userAgent?: string;
    lastSeenAt: string;
};

@Injectable()
export class PresenceService {
    private readonly ONLINE_WINDOW_MS = 60 * 1000;
    private readonly presenceMap = new Map<string, PresenceEntry>();

    heartbeat(data: {
        userId: string;
        role: string;
        username?: string;
        name?: string;
        email?: string;
        ipAddress?: string;
        userAgent?: string;
    }) {
        this.presenceMap.set(data.userId, {
            ...data,
            lastSeenAt: new Date().toISOString(),
        });
    }

    markOffline(userId: string) {
        this.presenceMap.delete(userId);
    }

    getPresence(userId: string) {
        const entry = this.presenceMap.get(userId);
        if (!entry) return null;

        const isOnline = Date.now() - new Date(entry.lastSeenAt).getTime() <= this.ONLINE_WINDOW_MS;
        if (!isOnline) {
            this.presenceMap.delete(userId);
            return null;
        }
        return entry;
    }
}
