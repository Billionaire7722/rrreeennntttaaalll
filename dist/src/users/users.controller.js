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
    getMessages(req) {
        return this.usersService.getMessages(req.user.userId);
    }
    sendMessage(req, sendMessageDto) {
        return this.usersService.sendMessage(req.user.userId, sendMessageDto);
    }
    getViewerMessages(skip, take) {
        return this.usersService.getViewerMessages(skip, take);
    }
    replyToViewer(req, viewerId, sendMessageDto) {
        return this.usersService.replyToViewer(req.user.userId, req.user.role, viewerId, sendMessageDto);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('profile'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.VIEWER),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)('favorites'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.VIEWER),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getFavorites", null);
__decorate([
    (0, common_1.Post)('favorites/toggle'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.VIEWER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, toggle_favorite_dto_1.ToggleFavoriteDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "toggleFavorite", null);
__decorate([
    (0, common_1.Get)('messages'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.VIEWER),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Post)('messages'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.VIEWER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, send_message_dto_1.SendMessageDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Get)('admin/messages'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.ADMIN, roles_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Query)('skip')),
    __param(1, (0, common_1.Query)('take')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getViewerMessages", null);
__decorate([
    (0, common_1.Post)('admin/messages/:viewerId/reply'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.ADMIN, roles_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('viewerId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, send_message_dto_1.SendMessageDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "replyToViewer", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map