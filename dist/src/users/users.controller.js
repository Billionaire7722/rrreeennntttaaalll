"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const toggle_favorite_dto_1 = require("./dto/toggle-favorite.dto");
const send_message_dto_1 = require("./dto/send-message.dto");
const change_password_dto_1 = require("./dto/change-password.dto");
const roles_guard_1 = require("../security/roles.guard");
const roles_decorator_1 = require("../security/roles.decorator");
const roles_enum_1 = require("../security/roles.enum");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    getProfile(req) {
        return this.usersService.getProfile(req.user.userId);
    }
    getFavorites(req) {
        return this.usersService.getFavorites(req.user.userId);
    }
    toggleFavorite(req, toggleFavoriteDto) {
        return this.usersService.toggleFavorite(req.user.userId, toggleFavoriteDto);
    }
    getConversations(req) {
        return this.usersService.getConversations(req.user.userId);
    }
    getMessageThread(req, otherId) {
        return this.usersService.getMessageThread(req.user.userId, otherId);
    }
    markConversationSeen(req, otherId) {
        return this.usersService.markConversationSeen(req.user.userId, otherId);
    }
    sendMessage(req, sendMessageDto) {
        return this.usersService.sendMessage(req.user.userId, sendMessageDto);
    }
    getViewerMessages(req, skip, take) {
        return this.usersService.getViewerMessages(req.user.userId, req.user.role, skip, take);
    }
    replyToViewer(req, viewerId, sendMessageDto) {
        return this.usersService.replyToViewer(req.user.userId, req.user.role, viewerId, sendMessageDto);
    }
    markAdminConversationSeen(req, viewerId) {
        return this.usersService.markAdminConversationSeen(req.user.userId, req.user.role, viewerId);
    }
    updateAvatar(req, body) {
        return this.usersService.updateAvatar(req.user.userId, body.url);
    }
    updateCover(req, body) {
        return this.usersService.updateCover(req.user.userId, body.url);
    }
    getPublicProfile(id) {
        return this.usersService.getPublicProfile(id);
    }
    updateProfile(req, body) {
        return this.usersService.updateProfile(req.user.userId, body);
    }
    changePassword(req, changePasswordDto) {
        return this.usersService.changePassword(req.user.userId, changePasswordDto);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('profile'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.USER),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)('favorites'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.USER),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getFavorites", null);
__decorate([
    (0, common_1.Post)('favorites/toggle'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.USER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, toggle_favorite_dto_1.ToggleFavoriteDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "toggleFavorite", null);
__decorate([
    (0, common_1.Get)('conversations'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.USER),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getConversations", null);
__decorate([
    (0, common_1.Get)('messages/:otherId'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.USER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('otherId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getMessageThread", null);
__decorate([
    (0, common_1.Post)('messages/:otherId/seen'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.USER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('otherId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "markConversationSeen", null);
__decorate([
    (0, common_1.Post)('messages'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.USER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, send_message_dto_1.SendMessageDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Get)('admin/messages'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('skip')),
    __param(2, (0, common_1.Query)('take')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getViewerMessages", null);
__decorate([
    (0, common_1.Post)('admin/messages/:viewerId/reply'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('viewerId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, send_message_dto_1.SendMessageDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "replyToViewer", null);
__decorate([
    (0, common_1.Post)('admin/messages/:viewerId/seen'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('viewerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "markAdminConversationSeen", null);
__decorate([
    (0, common_1.Post)('avatar'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.USER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateAvatar", null);
__decorate([
    (0, common_1.Post)('cover'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.USER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateCover", null);
__decorate([
    (0, common_1.Get)('public/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getPublicProfile", null);
__decorate([
    (0, common_1.Post)('profile'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.USER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Post)('change-password'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.USER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, change_password_dto_1.ChangePasswordDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "changePassword", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map