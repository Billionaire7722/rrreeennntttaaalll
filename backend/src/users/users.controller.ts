import { Controller, Get, Post, Body, UseGuards, Request, Param, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ToggleFavoriteDto } from './dto/toggle-favorite.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
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

    @Get('conversations')
    @Roles(Role.USER)
    getConversations(@Request() req) {
        return this.usersService.getConversations(req.user.userId);
    }

    @Get('messages/:otherId')
    @Roles(Role.USER)
    getMessageThread(@Request() req, @Param('otherId') otherId: string) {
        return this.usersService.getMessageThread(req.user.userId, otherId);
    }

    @Post('messages/:otherId/seen')
    @Roles(Role.USER)
    markConversationSeen(@Request() req, @Param('otherId') otherId: string) {
        return this.usersService.markConversationSeen(req.user.userId, otherId);
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
    updateProfile(@Request() req, @Body() body: { firstName?: string; lastName?: string; bio?: string; email?: string }) {
        return this.usersService.updateProfile(req.user.userId, body);
    }

    @Post('change-password')
    @Roles(Role.USER)
    changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
        return this.usersService.changePassword(req.user.userId, changePasswordDto);
    }
}
