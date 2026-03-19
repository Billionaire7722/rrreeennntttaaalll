import { Injectable } from '@nestjs/common';

export type PresenceSnapshot = {
    userId: string;
    role?: string;
    username?: string;
    name?: string;
    email?: string;
    ipAddress?: string;
    userAgent?: string;
    lastSeenAt: string | null;
    isOnline: boolean;
};

type PresenceEntry = Omit<PresenceSnapshot, 'isOnline'> & {
    lastHeartbeatAt: string | null;
    socketIds: Set<string>;
};

@Injectable()
export class PresenceService {
    private readonly ONLINE_WINDOW_MS = 60 * 1000;
    private readonly presenceMap = new Map<string, PresenceEntry>();

    private nowIso() {
        return new Date().toISOString();
    }

    private applyMetadata(
        entry: PresenceEntry,
        data: {
            role?: string;
            username?: string;
            name?: string;
            email?: string;
            ipAddress?: string;
            userAgent?: string;
        },
    ) {
        if (data.role) entry.role = data.role;
        if (data.username) entry.username = data.username;
        if (data.name) entry.name = data.name;
        if (data.email) entry.email = data.email;
        if (data.ipAddress) entry.ipAddress = data.ipAddress;
        if (data.userAgent) entry.userAgent = data.userAgent;
    }

    private getOrCreateEntry(data: {
        userId: string;
        role?: string;
        username?: string;
        name?: string;
        email?: string;
        ipAddress?: string;
        userAgent?: string;
    }) {
        const existing = this.presenceMap.get(data.userId);
        if (existing) {
            this.applyMetadata(existing, data);
            return existing;
        }

        const entry: PresenceEntry = {
            userId: data.userId,
            role: data.role,
            username: data.username,
            name: data.name,
            email: data.email,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            lastSeenAt: this.nowIso(),
            lastHeartbeatAt: null,
            socketIds: new Set<string>(),
        };

        this.presenceMap.set(data.userId, entry);
        return entry;
    }

    private isOnline(entry: PresenceEntry) {
        if (entry.socketIds.size > 0) {
            return true;
        }

        if (!entry.lastHeartbeatAt) {
            return false;
        }

        return Date.now() - new Date(entry.lastHeartbeatAt).getTime() <= this.ONLINE_WINDOW_MS;
    }

    heartbeat(data: {
        userId: string;
        role: string;
        username?: string;
        name?: string;
        email?: string;
        ipAddress?: string;
        userAgent?: string;
    }) {
        const now = this.nowIso();
        const entry = this.getOrCreateEntry(data);
        entry.lastHeartbeatAt = now;
        entry.lastSeenAt = now;
    }

    markSocketConnected(
        data: {
            userId: string;
            role?: string;
            username?: string;
            name?: string;
            email?: string;
            ipAddress?: string;
            userAgent?: string;
        },
        socketId: string,
    ) {
        const entry = this.getOrCreateEntry(data);
        entry.socketIds.add(socketId);
        entry.lastSeenAt = this.nowIso();
    }

    markSocketDisconnected(userId: string, socketId: string) {
        const entry = this.presenceMap.get(userId);
        if (!entry) return;

        entry.socketIds.delete(socketId);
        entry.lastSeenAt = this.nowIso();
    }

    markOffline(userId: string) {
        const entry = this.presenceMap.get(userId);
        if (!entry) return;

        entry.socketIds.clear();
        entry.lastHeartbeatAt = null;
        entry.lastSeenAt = this.nowIso();
    }

    getPresence(userId: string): PresenceSnapshot | null {
        const entry = this.presenceMap.get(userId);
        if (!entry) return null;

        return {
            userId: entry.userId,
            role: entry.role,
            username: entry.username,
            name: entry.name,
            email: entry.email,
            ipAddress: entry.ipAddress,
            userAgent: entry.userAgent,
            lastSeenAt: entry.lastSeenAt,
            isOnline: this.isOnline(entry),
        };
    }
}
