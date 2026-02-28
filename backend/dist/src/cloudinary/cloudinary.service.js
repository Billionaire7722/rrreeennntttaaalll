"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CloudinaryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudinaryService = void 0;
const common_1 = require("@nestjs/common");
const cloudinary_1 = require("cloudinary");
const stream_1 = require("stream");
let CloudinaryService = CloudinaryService_1 = class CloudinaryService {
    logger = new common_1.Logger(CloudinaryService_1.name);
    bufferToStream(buffer) {
        const readable = new stream_1.Readable();
        readable.push(buffer);
        readable.push(null);
        return readable;
    }
    async uploadImage(file) {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                folder: 'rental_app/images',
                format: 'webp',
                quality: 'auto:good',
                fetch_format: 'auto',
                transformation: [
                    { width: 1280, height: 960, crop: 'limit' },
                ],
            }, (error, result) => {
                if (error) {
                    this.logger.error('Cloudinary image upload error:', error);
                    return reject(error);
                }
                this.logger.log(`Image uploaded: ${result?.secure_url}`);
                resolve(result);
            });
            this.bufferToStream(file.buffer).pipe(uploadStream);
        });
    }
    async uploadVideo(file) {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                folder: 'rental_app/videos',
                resource_type: 'video',
                quality: 'auto:good',
            }, (error, result) => {
                if (error) {
                    this.logger.error('Cloudinary video upload error:', error);
                    return reject(error);
                }
                this.logger.log(`Video uploaded: ${result?.secure_url}`);
                resolve(result);
            });
            this.bufferToStream(file.buffer).pipe(uploadStream);
        });
    }
};
exports.CloudinaryService = CloudinaryService;
exports.CloudinaryService = CloudinaryService = CloudinaryService_1 = __decorate([
    (0, common_1.Injectable)()
], CloudinaryService);
//# sourceMappingURL=cloudinary.service.js.map