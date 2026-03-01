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
export declare class PresenceService {
    private readonly ONLINE_WINDOW_MS;
    private readonly presenceMap;
    heartbeat(data: {
        userId: string;
        role: string;
        username?: string;
        name?: string;
        email?: string;
        ipAddress?: string;
        userAgent?: string;
    }): void;
    markOffline(userId: string): void;
    getPresence(userId: string): PresenceEntry | null;
}
export {};
