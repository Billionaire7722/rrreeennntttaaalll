import { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
export declare class CloudinaryService {
    private readonly logger;
    private bufferToStream;
    uploadImage(file: Express.Multer.File): Promise<UploadApiResponse | UploadApiErrorResponse>;
    uploadVideo(file: Express.Multer.File): Promise<UploadApiResponse | UploadApiErrorResponse>;
}
