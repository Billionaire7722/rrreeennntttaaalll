import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Controller('upload')
export class UploadController {
    private readonly logger = new Logger(UploadController.name);

    constructor(private readonly cloudinaryService: CloudinaryService) { }

    @Post('image')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: memoryStorage(),
            limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
            fileFilter: (_req, file, cb) => {
                // Accept all common viewable image types
                const allowed = [
                    'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
                    'image/webp', 'image/heic', 'image/heif',
                    'image/bmp', 'image/tiff', 'image/svg+xml',
                ];
                if (allowed.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
                    cb(null, true);
                } else {
                    cb(new BadRequestException(`File type "${file.mimetype}" is not supported`), false);
                }
            },
        }),
    )
    async uploadImage(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded. Make sure the form field is named "file".');
        }
        if (!file.buffer || file.buffer.length === 0) {
            throw new BadRequestException('File buffer is empty. Ensure storage is set to memoryStorage.');
        }

        try {
            this.logger.log(`Uploading image: ${file.originalname} (${file.size} bytes, ${file.mimetype})`);
            const result = await this.cloudinaryService.uploadImage(file);
            this.logger.log(`Upload successful: ${result.secure_url}`);
            return { url: result.secure_url };
        } catch (err: any) {
            this.logger.error('Cloudinary image upload failed:', err?.message || err);
            throw new InternalServerErrorException(
                `Cloudinary upload failed: ${err?.message || 'Unknown error'}`,
            );
        }
    }

    @Post('video')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: memoryStorage(),
            limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB max for video
            fileFilter: (_req, file, cb) => {
                if (file.mimetype.startsWith('video/')) {
                    cb(null, true);
                } else {
                    cb(new BadRequestException(`File type "${file.mimetype}" is not a video`), false);
                }
            },
        }),
    )
    async uploadVideo(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded. Make sure the form field is named "file".');
        }
        if (!file.buffer || file.buffer.length === 0) {
            throw new BadRequestException('File buffer is empty.');
        }

        try {
            this.logger.log(`Uploading video: ${file.originalname} (${file.size} bytes)`);
            const result = await this.cloudinaryService.uploadVideo(file);
            this.logger.log(`Video upload successful: ${result.secure_url}`);
            return { url: result.secure_url };
        } catch (err: any) {
            this.logger.error('Cloudinary video upload failed:', err?.message || err);
            throw new InternalServerErrorException(
                `Cloudinary upload failed: ${err?.message || 'Unknown error'}`,
            );
        }
    }
}
