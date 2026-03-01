"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresenceService = void 0;
const common_1 = require("@nestjs/common");
let PresenceService = class PresenceService {
    ONLINE_WINDOW_MS = 60 * 1000;
    presenceMap = new Map();
    heartbeat(data) {
        this.presenceMap.set(data.userId, {
            ...data,
            lastSeenAt: new Date().toISOString(),
        });
    }
    markOffline(userId) {
        this.presenceMap.delete(userId);
    }
    getPresence(userId) {
        const entry = this.presenceMap.get(userId);
        if (!entry)
            return null;
        const isOnline = Date.now() - new Date(entry.lastSeenAt).getTime() <= this.ONLINE_WINDOW_MS;
        if (!isOnline) {
            this.presenceMap.delete(userId);
            return null;
        }
        return entry;
    }
};
exports.PresenceService = PresenceService;
exports.PresenceService = PresenceService = __decorate([
    (0, common_1.Injectable)()
], PresenceService);
//# sourceMappingURL=presence.service.js.map