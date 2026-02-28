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
var UploadController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const cloudinary_service_1 = require("../cloudinary/cloudinary.service");
let UploadController = UploadController_1 = class UploadController {
    cloudinaryService;
    logger = new common_1.Logger(UploadController_1.name);
    constructor(cloudinaryService) {
        this.cloudinaryService = cloudinaryService;
    }
    async uploadImage(file) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded. Make sure the form field is named "file".');
        }
        if (!file.buffer || file.buffer.length === 0) {
            throw new common_1.BadRequestException('File buffer is empty. Ensure storage is set to memoryStorage.');
        }
        try {
            this.logger.log(`Uploading image: ${file.originalname} (${file.size} bytes, ${file.mimetype})`);
            const result = await this.cloudinaryService.uploadImage(file);
            this.logger.log(`Upload successful: ${result.secure_url}`);
            return { url: result.secure_url };
        }
        catch (err) {
            this.logger.error('Cloudinary image upload failed:', err?.message || err);
            throw new common_1.InternalServerErrorException(`Cloudinary upload failed: ${err?.message || 'Unknown error'}`);
        }
    }
    async uploadVideo(file) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded. Make sure the form field is named "file".');
        }
        if (!file.buffer || file.buffer.length === 0) {
            throw new common_1.BadRequestException('File buffer is empty.');
        }
        try {
            this.logger.log(`Uploading video: ${file.originalname} (${file.size} bytes)`);
            const result = await this.cloudinaryService.uploadVideo(file);
            this.logger.log(`Video upload successful: ${result.secure_url}`);
            return { url: result.secure_url };
        }
        catch (err) {
            this.logger.error('Cloudinary video upload failed:', err?.message || err);
            throw new common_1.InternalServerErrorException(`Cloudinary upload failed: ${err?.message || 'Unknown error'}`);
        }
    }
};
exports.UploadController = UploadController;
__decorate([
    (0, common_1.Post)('image'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 20 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            const allowed = [
                'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
                'image/webp', 'image/heic', 'image/heif',
                'image/bmp', 'image/tiff', 'image/svg+xml',
            ];
            if (allowed.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
                cb(null, true);
            }
            else {
                cb(new common_1.BadRequestException(`File type "${file.mimetype}" is not supported`), false);
            }
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadImage", null);
__decorate([
    (0, common_1.Post)('video'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 200 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            if (file.mimetype.startsWith('video/')) {
                cb(null, true);
            }
            else {
                cb(new common_1.BadRequestException(`File type "${file.mimetype}" is not a video`), false);
            }
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadVideo", null);
exports.UploadController = UploadController = UploadController_1 = __decorate([
    (0, common_1.Controller)('upload'),
    __metadata("design:paramtypes", [cloudinary_service_1.CloudinaryService])
], UploadController);
//# sourceMappingURL=upload.controller.js.map