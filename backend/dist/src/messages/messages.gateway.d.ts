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
            name: string;
            username: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
        };
    } & {
        id: string;
        created_at: Date;
        userId: string;
        senderId: string | null;
        senderRole: import("@prisma/client").$Enums.Role;
        content: string;
        seen_at: Date | null;
        seen_by_role: import("@prisma/client").$Enums.Role | null;
        receiverId: string | null;
        ticketId: string | null;
    }) | {
        error: string;
    }>;
    handleGetOnlineUsers(): string[];
    handleTyping(client: AuthenticatedSocket, data: {
        recipientId?: string;
        isTyping: boolean;
    }): void;
    emitToUser(userId: string, event: string, data: any): Promise<void>;
    sendMessageToUser(userId: string, message: any): Promise<void>;
    notifySuperAdmins(message: any): Promise<void>;
    notifyAdminOfReport(report: any): Promise<void>;
    notifyAdminOfTicket(ticket: any): Promise<void>;
}
export {};
