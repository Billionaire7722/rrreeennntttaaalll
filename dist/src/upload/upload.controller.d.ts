import { CloudinaryService } from '../cloudinary/cloudinary.service';
export declare class UploadController {
    private readonly cloudinaryService;
    private readonly logger;
    constructor(cloudinaryService: CloudinaryService);
    uploadImage(file: Express.Multer.File): Promise<{
        url: any;
    }>;
    uploadVideo(file: Express.Multer.File): Promise<{
        url: any;
    }>;
}
