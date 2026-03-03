import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../security/roles.enum';

interface AuthenticatedSocket extends Socket {
    user?: {
        userId: string;
        role: string;
    };
}

@WebSocketGateway({
    cors: {
        origin: '*',
        credentials: true,
    },
    namespace: '/messages',
})
export class MessagesGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
    @WebSocketServer()
    server: Server;

    private connectedClients = new Map<string, AuthenticatedSocket>();
    private userSockets = new Map<string, Set<string>>();

    constructor(
        private jwtService: JwtService,
        private prisma: PrismaService,
    ) {}

    afterInit(server: Server) {
        console.log('WebSocket Gateway initialized');
    }

    async handleConnection(client: AuthenticatedSocket) {
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
        } catch (error) {
            console.log('Client disconnected: invalid token', client.id);
            client.disconnect();
        }
    }

    handleDisconnect(client: AuthenticatedSocket) {
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

    @SubscribeMessage('send_message')
    async handleMessage(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { content: string; recipientId?: string },
    ) {
        if (!client.user) {
            return { error: 'Unauthorized' };
        }

        const { content, recipientId } = data;

        // Save message to database
        const message = await this.prisma.message.create({
            data: {
                userId: client.user.role === Role.VIEWER ? client.user.userId : (recipientId || client.user.userId),
                senderId: client.user.userId,
                senderRole: client.user.role as Role,
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

        // Emit to sender
        client.emit('message_sent', message);

        // If admin sending to viewer
        if (client.user.role === Role.ADMIN || client.user.role === Role.SUPER_ADMIN) {
            if (recipientId) {
                // Send to specific viewer
                const recipientSockets = this.userSockets.get(recipientId);
                if (recipientSockets) {
                    recipientSockets.forEach(socketId => {
                        this.connectedClients.get(socketId)?.emit('new_message', message);
                    });
                }
            } else {
                // Send to all viewers (broadcast from admin)
                this.server.emit('new_message', message);
            }
        } else {
            // Viewer sent message - notify selected admin or fallback to all admins
            if (recipientId) {
                this.notifyAdmins(message, recipientId);
            } else {
                this.notifyAdmins(message);
            }
        }

        return message;
    }

    @SubscribeMessage('get_online_users')
    handleGetOnlineUsers() {
        return Array.from(this.userSockets.keys());
    }

    @SubscribeMessage('typing')
    handleTyping(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { recipientId?: string; isTyping: boolean },
    ) {
        if (!client.user) return;

        if (client.user.role === Role.ADMIN || client.user.role === Role.SUPER_ADMIN) {
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
        } else {
            // Viewer typing - notify all admins
            this.server.emit('user_typing', {
                userId: client.user.userId,
                userName: client.user.role,
                isTyping: data.isTyping,
            });
        }
    }

    async notifyAdmins(message: any, onlyAdminId?: string) {
        this.connectedClients.forEach((socket) => {
            const isAdmin = socket.user?.role === Role.ADMIN || socket.user?.role === Role.SUPER_ADMIN;
            if (!isAdmin) return;
            if (onlyAdminId && socket.user?.userId !== onlyAdminId) return;
            socket.emit('new_message', message);
        });
    }

    // Helper method to send message from REST API
    async sendMessageToUser(userId: string, message: any) {
        const userSocketSet = this.userSockets.get(userId);
        if (userSocketSet) {
            userSocketSet.forEach(socketId => {
                this.connectedClients.get(socketId)?.emit('new_message', message);
            });
        }
    }
}
