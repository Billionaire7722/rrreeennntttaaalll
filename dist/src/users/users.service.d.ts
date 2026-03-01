import { PrismaService } from '../prisma/prisma.service';
import { ToggleFavoriteDto } from './dto/toggle-favorite.dto';
import { SendMessageDto } from './dto/send-message.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    getFavorites(userId: string): Promise<({
        house: {
            id: string;
            original_id: string;
            name: string;
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
            status: string | null;
            is_private_bathroom: boolean;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
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
                name: string;
                username: string;
                email: string;
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
        name: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        username: string;
        email: string;
        phone: string | null;
        password: string;
        role: import("@prisma/client").$Enums.Role;
        locked_until: Date | null;
    }>;
}
