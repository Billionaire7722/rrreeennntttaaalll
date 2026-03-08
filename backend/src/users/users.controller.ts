import { Controller, Get, Post, Body, UseGuards, Request, Param, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ToggleFavoriteDto } from './dto/toggle-favorite.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { RolesGuard } from '../security/roles.guard';
import { Roles } from '../security/roles.decorator';
import { Role } from '../security/roles.enum';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('profile')
    @Roles(Role.USER)
    getProfile(@Request() req) {
        return this.usersService.getProfile(req.user.userId);
    }

    @Get('favorites')
    @Roles(Role.USER)
    getFavorites(@Request() req) {
        return this.usersService.getFavorites(req.user.userId);
    }

    @Post('favorites/toggle')
    @Roles(Role.USER)
    toggleFavorite(@Request() req, @Body() toggleFavoriteDto: ToggleFavoriteDto) {
        return this.usersService.toggleFavorite(req.user.userId, toggleFavoriteDto);
    }

    @Get('messages')
    @Roles(Role.USER)
    getMessages(@Request() req) {
        return this.usersService.getMessages(req.user.userId);
    }

    @Post('messages/:adminId/seen')
    @Roles(Role.USER)
    markViewerConversationSeen(@Request() req, @Param('adminId') adminId: string) {
        return this.usersService.markViewerConversationSeen(req.user.userId, adminId);
    }

    @Post('messages')
    @Roles(Role.USER)
    sendMessage(@Request() req, @Body() sendMessageDto: SendMessageDto) {
        return this.usersService.sendMessage(req.user.userId, sendMessageDto);
    }

    @Get('admin/messages')
    @Roles(Role.SUPER_ADMIN)
    getViewerMessages(@Request() req, @Query('skip') skip?: number, @Query('take') take?: number) {
        return this.usersService.getViewerMessages(req.user.userId, req.user.role, skip, take);
    }

    @Post('admin/messages/:viewerId/reply')
    @Roles(Role.SUPER_ADMIN)
    replyToViewer(
        @Request() req,
        @Param('viewerId') viewerId: string,
        @Body() sendMessageDto: SendMessageDto
    ) {
        return this.usersService.replyToViewer(req.user.userId, req.user.role, viewerId, sendMessageDto);
    }

    @Post('admin/messages/:viewerId/seen')
    @Roles(Role.SUPER_ADMIN)
    markAdminConversationSeen(@Request() req, @Param('viewerId') viewerId: string) {
        return this.usersService.markAdminConversationSeen(req.user.userId, req.user.role, viewerId);
    }

    @Post('avatar')
    @Roles(Role.USER)
    updateAvatar(@Request() req, @Body() body: { url: string }) {
        return this.usersService.updateAvatar(req.user.userId, body.url);
    }

    @Post('cover')
    @Roles(Role.USER)
    updateCover(@Request() req, @Body() body: { url: string }) {
        return this.usersService.updateCover(req.user.userId, body.url);
    }

    @Get('public/:id')
    getPublicProfile(@Param('id') id: string) {
        return this.usersService.getPublicProfile(id);
    }

    @Post('profile')
    @Roles(Role.USER)
    updateProfile(@Request() req, @Body() body: { name?: string; bio?: string }) {
        return this.usersService.updateProfile(req.user.userId, body);
    }
}
