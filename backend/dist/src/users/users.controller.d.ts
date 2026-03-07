import { UsersService } from './users.service';
import { ToggleFavoriteDto } from './dto/toggle-favorite.dto';
import { SendMessageDto } from './dto/send-message.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(req: any): Promise<{
        id: string;
        username: string;
        email: string;
        name: string;
        phone: string | null;
        password: string;
        avatarUrl: string | null;
        role: import("@prisma/client").$Enums.Role;
        status: string;
        locked_until: Date | null;
        deleted_at: Date | null;
        created_at: Date;
        updated_at: Date;
    }>;
    getFavorites(req: any): Promise<({
        house: {
            id: string;
            name: string;
            status: string | null;
            deleted_at: Date | null;
            created_at: Date;
            updated_at: Date;
            original_id: string;
            property_type: string | null;
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
            video_url_1: string | null;
            video_url_2: string | null;
            description: string | null;
            is_private_bathroom: boolean;
            contact_phone: string | null;
            owner_id: string | null;
        };
    } & {
        id: string;
        created_at: Date;
        userId: string;
        houseId: string;
    })[]>;
    toggleFavorite(req: any, toggleFavoriteDto: ToggleFavoriteDto): Promise<{
        message: string;
    }>;
    getMessages(req: any): Promise<({
        user: {
            id: string;
            username: string;
            name: string;
            avatarUrl: string | null;
        };
        receiver: {
            id: string;
            username: string;
            name: string;
            avatarUrl: string | null;
        } | null;
    } & {
        id: string;
        created_at: Date;
        userId: string;
        content: string;
        senderId: string | null;
        senderRole: import("@prisma/client").$Enums.Role;
        seen_at: Date | null;
        seen_by_role: import("@prisma/client").$Enums.Role | null;
        receiverId: string | null;
    })[]>;
    markViewerConversationSeen(req: any, adminId: string): Promise<{
        updated: number;
    }>;
    sendMessage(req: any, sendMessageDto: SendMessageDto): Promise<{
        id: string;
        created_at: Date;
        userId: string;
        content: string;
        senderId: string | null;
        senderRole: import("@prisma/client").$Enums.Role;
        seen_at: Date | null;
        seen_by_role: import("@prisma/client").$Enums.Role | null;
        receiverId: string | null;
    }>;
    getViewerMessages(req: any, skip?: number, take?: number): Promise<{
        items: ({
            user: {
                id: string;
                username: string;
                email: string;
                name: string;
                phone: string | null;
                role: import("@prisma/client").$Enums.Role;
            };
            receiver: {
                id: string;
                username: string;
                name: string;
                avatarUrl: string | null;
            } | null;
        } & {
            id: string;
            created_at: Date;
            userId: string;
            content: string;
            senderId: string | null;
            senderRole: import("@prisma/client").$Enums.Role;
            seen_at: Date | null;
            seen_by_role: import("@prisma/client").$Enums.Role | null;
            receiverId: string | null;
        })[];
        skip: number;
        take: number;
    }>;
    replyToViewer(req: any, viewerId: string, sendMessageDto: SendMessageDto): Promise<{
        id: string;
        created_at: Date;
        userId: string;
        content: string;
        senderId: string | null;
        senderRole: import("@prisma/client").$Enums.Role;
        seen_at: Date | null;
        seen_by_role: import("@prisma/client").$Enums.Role | null;
        receiverId: string | null;
    }>;
    markAdminConversationSeen(req: any, viewerId: string): Promise<{
        updated: number;
    }>;
    updateAvatar(req: any, body: {
        url: string;
    }): Promise<{
        id: string;
        username: string;
        email: string;
        name: string;
        phone: string | null;
        password: string;
        avatarUrl: string | null;
        role: import("@prisma/client").$Enums.Role;
        status: string;
        locked_until: Date | null;
        deleted_at: Date | null;
        created_at: Date;
        updated_at: Date;
    }>;
}
