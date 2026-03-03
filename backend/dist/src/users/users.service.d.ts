import { PrismaService } from '../prisma/prisma.service';
import { ToggleFavoriteDto } from './dto/toggle-favorite.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { MessagesGateway } from '../messages/messages.gateway';
export declare class UsersService {
    private prisma;
    private messagesGateway;
    constructor(prisma: PrismaService, messagesGateway: MessagesGateway);
    getFavorites(userId: string): Promise<({
        house: {
            id: string;
            name: string;
            status: string | null;
            deleted_at: Date | null;
            created_at: Date;
            updated_at: Date;
            original_id: string;
            address: string;
            district: string;
            city: string;
            latitude: number | null;
            longitude: number | null;
            price: number | null;
            payment_method: string | null;
            bedrooms: number | null;
            square: number | null;
            image_url_1: string | null;
            image_url_2: string | null;
            image_url_3: string | null;
            image_url_4: string | null;
            image_url_5: string | null;
            image_url_6: string | null;
            image_url_7: string | null;
            image_url_8: string | null;
            description: string | null;
            is_private_bathroom: boolean;
        };
    } & {
        id: string;
        created_at: Date;
        userId: string;
        houseId: string;
    })[]>;
    toggleFavorite(userId: string, toggleFavoriteDto: ToggleFavoriteDto): Promise<{
        message: string;
    }>;
    getMessages(userId: string): Promise<{
        id: string;
        created_at: Date;
        userId: string;
        content: string;
        senderId: string | null;
        senderRole: import("@prisma/client").$Enums.Role;
    }[]>;
    sendMessage(userId: string, sendMessageDto: SendMessageDto): Promise<{
        id: string;
        created_at: Date;
        userId: string;
        content: string;
        senderId: string | null;
        senderRole: import("@prisma/client").$Enums.Role;
    }>;
    getViewerMessages(skip?: number, take?: number): Promise<{
        items: ({
            user: {
                id: string;
                username: string;
                email: string;
                name: string;
                phone: string | null;
                role: import("@prisma/client").$Enums.Role;
            };
        } & {
            id: string;
            created_at: Date;
            userId: string;
            content: string;
            senderId: string | null;
            senderRole: import("@prisma/client").$Enums.Role;
        })[];
        skip: number;
        take: number;
    }>;
    replyToViewer(adminId: string, adminRole: string, viewerId: string, sendMessageDto: SendMessageDto): Promise<{
        id: string;
        created_at: Date;
        userId: string;
        content: string;
        senderId: string | null;
        senderRole: import("@prisma/client").$Enums.Role;
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        username: string;
        email: string;
        name: string;
        phone: string | null;
        password: string;
        role: import("@prisma/client").$Enums.Role;
        status: string;
        locked_until: Date | null;
        deleted_at: Date | null;
        created_at: Date;
        updated_at: Date;
    }>;
}
