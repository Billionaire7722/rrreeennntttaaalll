import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
interface AuthenticatedSocket extends Socket {
    user?: {
        userId: string;
        role: string;
    };
}
export declare class MessagesGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    private prisma;
    server: Server;
    private connectedClients;
    private userSockets;
    constructor(jwtService: JwtService, prisma: PrismaService);
    afterInit(server: Server): void;
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket): void;
    handleMessage(client: AuthenticatedSocket, data: {
        content: string;
        recipientId?: string;
    }): Promise<({
        user: {
            id: string;
            username: string;
            email: string;
            name: string;
            role: import("@prisma/client").$Enums.Role;
        };
    } & {
        id: string;
        created_at: Date;
        userId: string;
        content: string;
        senderId: string | null;
        senderRole: import("@prisma/client").$Enums.Role;
    }) | {
        error: string;
    }>;
    handleGetOnlineUsers(): string[];
    handleTyping(client: AuthenticatedSocket, data: {
        recipientId?: string;
        isTyping: boolean;
    }): void;
    private notifyAdmins;
    sendMessageToUser(userId: string, message: any): Promise<void>;
}
export {};
