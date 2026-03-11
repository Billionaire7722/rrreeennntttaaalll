import { PrismaService } from '../prisma/prisma.service';
import { ToggleFavoriteDto } from './dto/toggle-favorite.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { MessagesGateway } from '../messages/messages.gateway';
export declare class UsersService {
    private prisma;
    private messagesGateway;
    constructor(prisma: PrismaService, messagesGateway: MessagesGateway);
    private isSuperAdmin;
    getFavorites(userId: string): Promise<({
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
            ward: string | null;
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
    toggleFavorite(userId: string, toggleFavoriteDto: ToggleFavoriteDto): Promise<{
        message: string;
    }>;
    getMessageThread(userId: string, otherId: string): Promise<({
        user: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
        receiver: {
            id: string;
            name: string;
            avatarUrl: string | null;
        } | null;
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
    })[]>;
    getConversations(userId: string): Promise<any[]>;
    sendMessage(userId: string, sendMessageDto: SendMessageDto): Promise<{
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
    }>;
    getViewerMessages(adminId: string, adminRole: string, skip?: number, take?: number): Promise<{
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
            senderId: string | null;
            senderRole: import("@prisma/client").$Enums.Role;
            content: string;
            seen_at: Date | null;
            seen_by_role: import("@prisma/client").$Enums.Role | null;
            receiverId: string | null;
            ticketId: string | null;
        })[];
        skip: number;
        take: number;
    }>;
    replyToViewer(adminId: string, adminRole: string, viewerId: string, sendMessageDto: SendMessageDto): Promise<{
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
    }>;
    markConversationSeen(userId: string, otherId: string): Promise<{
        updated: number;
    }>;
    markAdminConversationSeen(adminId: string, adminRole: string, viewerId: string): Promise<{
        updated: number;
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        username: string;
        email: string;
        name: string;
        firstName: string | null;
        lastName: string | null;
        phone: string | null;
        password: string;
        avatarUrl: string | null;
        coverUrl: string | null;
        role: import("@prisma/client").$Enums.Role;
        status: string;
        name_updated_at: Date | null;
        bio: string | null;
        deleted_at: Date | null;
        created_at: Date;
        updated_at: Date;
        failed_attempts: number;
        last_failed_attempt: Date | null;
        locked_until: Date | null;
    }>;
    updateAvatar(userId: string, avatarUrl: string): Promise<{
        id: string;
        username: string;
        email: string;
        name: string;
        firstName: string | null;
        lastName: string | null;
        phone: string | null;
        password: string;
        avatarUrl: string | null;
        coverUrl: string | null;
        role: import("@prisma/client").$Enums.Role;
        status: string;
        name_updated_at: Date | null;
        bio: string | null;
        deleted_at: Date | null;
        created_at: Date;
        updated_at: Date;
        failed_attempts: number;
        last_failed_attempt: Date | null;
        locked_until: Date | null;
    }>;
    updateCover(userId: string, coverUrl: string): Promise<{
        id: string;
        username: string;
        email: string;
        name: string;
        firstName: string | null;
        lastName: string | null;
        phone: string | null;
        password: string;
        avatarUrl: string | null;
        coverUrl: string | null;
        role: import("@prisma/client").$Enums.Role;
        status: string;
        name_updated_at: Date | null;
        bio: string | null;
        deleted_at: Date | null;
        created_at: Date;
        updated_at: Date;
        failed_attempts: number;
        last_failed_attempt: Date | null;
        locked_until: Date | null;
    }>;
    getPublicProfile(userId: string): Promise<{
        id: string;
        name: string;
        avatarUrl: string | null;
        coverUrl: string | null;
        bio: string | null;
        created_at: Date;
        ownedHouses: {
            id: string;
            name: string;
            status: string | null;
            property_type: string | null;
            address: string;
            district: string;
            city: string;
            price: number | null;
            bedrooms: number | null;
            square: number | null;
            image_url_1: string | null;
            is_private_bathroom: boolean;
        }[];
    }>;
    updateProfile(userId: string, data: {
        firstName?: string;
        lastName?: string;
        bio?: string;
        email?: string;
    }): Promise<{
        id: string;
        username: string;
        email: string;
        name: string;
        firstName: string | null;
        lastName: string | null;
        phone: string | null;
        password: string;
        avatarUrl: string | null;
        coverUrl: string | null;
        role: import("@prisma/client").$Enums.Role;
        status: string;
        name_updated_at: Date | null;
        bio: string | null;
        deleted_at: Date | null;
        created_at: Date;
        updated_at: Date;
        failed_attempts: number;
        last_failed_attempt: Date | null;
        locked_until: Date | null;
    }>;
    changePassword(userId: string, data: ChangePasswordDto): Promise<{
        message: string;
    }>;
}
