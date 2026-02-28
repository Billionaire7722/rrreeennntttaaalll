import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary, UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
    private readonly logger = new Logger(CloudinaryService.name);

    /**
     * Converts a Buffer to a Readable stream — used for Cloudinary's upload_stream.
     * Avoids relying on the external `buffer-to-stream` package.
     */
    private bufferToStream(buffer: Buffer): Readable {
        const readable = new Readable();
        readable.push(buffer);
        readable.push(null); // Signal end of stream
        return readable;
    }

    async uploadImage(
        file: Express.Multer.File,
    ): Promise<UploadApiResponse | UploadApiErrorResponse> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'rental_app/images',
                    format: 'webp',
                    quality: 'auto:good',
                    fetch_format: 'auto',
                    transformation: [
                        { width: 1280, height: 960, crop: 'limit' }, // max dimensions, preserve aspect
                    ],
                },
                (error, result) => {
                    if (error) {
                        this.logger.error('Cloudinary image upload error:', error);
                        return reject(error);
                    }
                    this.logger.log(`Image uploaded: ${result?.secure_url}`);
                    resolve(result as UploadApiResponse);
                },
            );

            this.bufferToStream(file.buffer).pipe(uploadStream);
        });
    }

    async uploadVideo(
        file: Express.Multer.File,
    ): Promise<UploadApiResponse | UploadApiErrorResponse> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'rental_app/videos',
                    resource_type: 'video',
                    quality: 'auto:good',
                },
                (error, result) => {
                    if (error) {
                        this.logger.error('Cloudinary video upload error:', error);
                        return reject(error);
                    }
                    this.logger.log(`Video uploaded: ${result?.secure_url}`);
                    resolve(result as UploadApiResponse);
                },
            );

            this.bufferToStream(file.buffer).pipe(uploadStream);
        });
    }
}
