"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const roles_enum_1 = require("../security/roles.enum");
let MessagesGateway = class MessagesGateway {
    jwtService;
    prisma;
    server;
    connectedClients = new Map();
    userSockets = new Map();
    constructor(jwtService, prisma) {
        this.jwtService = jwtService;
        this.prisma = prisma;
    }
    afterInit(server) {
        console.log('WebSocket Gateway initialized');
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token ||
                client.handshake.headers?.authorization?.replace('Bearer ', '');
            if (!token) {
                console.log('Client disconnected: no token', client.id);
                client.disconnect();
                return;
            }
            const payload = this.jwtService.verify(token);
            client.user = {
                userId: payload.sub || payload.userId,
                role: payload.role,
            };
            this.connectedClients.set(client.id, client);
            if (!this.userSockets.has(client.user.userId)) {
                this.userSockets.set(client.user.userId, new Set());
            }
            this.userSockets.get(client.user.userId)?.add(client.id);
            console.log(`Client connected: ${client.user.userId} (${client.user.role}) - ${client.id}`);
        }
        catch (error) {
            console.log('Client disconnected: invalid token', client.id);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        if (client.user) {
            this.connectedClients.delete(client.id);
            const userSocketSet = this.userSockets.get(client.user.userId);
            if (userSocketSet) {
                userSocketSet.delete(client.id);
                if (userSocketSet.size === 0) {
                    this.userSockets.delete(client.user.userId);
                }
            }
            console.log(`Client disconnected: ${client.user.userId} - ${client.id}`);
        }
    }
    async handleMessage(client, data) {
        if (!client.user) {
            return { error: 'Unauthorized' };
        }
        const { content, recipientId } = data;
        const message = await this.prisma.message.create({
            data: {
                userId: client.user.userId,
                receiverId: recipientId || null,
                senderId: client.user.userId,
                senderRole: client.user.role,
                content,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });
        client.emit('message_sent', message);
        if (recipientId) {
            this.sendMessageToUser(recipientId, message);
        }
        else {
            this.notifySuperAdmins(message);
        }
        return message;
    }
    handleGetOnlineUsers() {
        return Array.from(this.userSockets.keys());
    }
    handleTyping(client, data) {
        if (!client.user)
            return;
        if (data.recipientId) {
            const recipientSockets = this.userSockets.get(data.recipientId);
            if (recipientSockets) {
                recipientSockets.forEach(socketId => {
                    this.connectedClients.get(socketId)?.emit('user_typing', {
                        userId: client.user?.userId,
                        isTyping: data.isTyping,
                    });
                });
            }
        }
        else {
            this.connectedClients.forEach((socket) => {
                if (socket.user?.role === roles_enum_1.Role.SUPER_ADMIN) {
                    socket.emit('user_typing', {
                        userId: client.user?.userId,
                        userName: client.user?.role,
                        isTyping: data.isTyping,
                    });
                }
            });
        }
    }
    async emitToUser(userId, event, data) {
        const userSocketSet = this.userSockets.get(userId);
        if (userSocketSet) {
            userSocketSet.forEach(socketId => {
                this.connectedClients.get(socketId)?.emit(event, data);
            });
        }
    }
    async sendMessageToUser(userId, message) {
        return this.emitToUser(userId, 'new_message', message);
    }
    async notifySuperAdmins(message) {
        this.connectedClients.forEach((socket) => {
            if (socket.user?.role !== roles_enum_1.Role.SUPER_ADMIN)
                return;
            socket.emit('new_message', message);
        });
    }
};
exports.MessagesGateway = MessagesGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], MessagesGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('send_message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MessagesGateway.prototype, "handleMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('get_online_users'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MessagesGateway.prototype, "handleGetOnlineUsers", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], MessagesGateway.prototype, "handleTyping", null);
exports.MessagesGateway = MessagesGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
            credentials: true,
        },
        namespace: '/messages',
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        prisma_service_1.PrismaService])
], MessagesGateway);
//# sourceMappingURL=messages.gateway.js.map