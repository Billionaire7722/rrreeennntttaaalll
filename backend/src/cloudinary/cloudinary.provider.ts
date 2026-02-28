import { v2 as cloudinary } from 'cloudinary';

export const CLOUDINARY = 'Cloudinary';

export const CloudinaryProvider = {
    provide: CLOUDINARY,
    useFactory: () => {
        const cloudinaryUrl = process.env.CLOUDINARY_URL;

        if (cloudinaryUrl) {
            return cloudinary.config(cloudinaryUrl);
        }

        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.API_Key || process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.API_Secret || process.env.CLOUDINARY_API_SECRET;

        if (!cloudName || !apiKey || !apiSecret) {
            throw new Error(
                'Cloudinary config is missing. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY/API_Key + CLOUDINARY_API_SECRET/API_Secret.',
            );
        }

        return cloudinary.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret,
        });
    },
};
