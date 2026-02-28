import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ToggleFavoriteDto } from './dto/toggle-favorite.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('profile')
    getProfile(@Request() req) {
        return this.usersService.getProfile(req.user.userId);
    }

    @Get('favorites')
    getFavorites(@Request() req) {
        return this.usersService.getFavorites(req.user.userId);
    }

    @Post('favorites/toggle')
    toggleFavorite(@Request() req, @Body() toggleFavoriteDto: ToggleFavoriteDto) {
        return this.usersService.toggleFavorite(req.user.userId, toggleFavoriteDto);
    }

    @Get('messages')
    getMessages(@Request() req) {
        return this.usersService.getMessages(req.user.userId);
    }

    @Post('messages')
    sendMessage(@Request() req, @Body() sendMessageDto: SendMessageDto) {
        return this.usersService.sendMessage(req.user.userId, sendMessageDto);
    }
}
