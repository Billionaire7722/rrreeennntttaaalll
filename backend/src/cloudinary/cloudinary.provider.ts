import { v2 as cloudinary } from 'cloudinary';

export const CLOUDINARY = 'Cloudinary';

export const CloudinaryProvider = {
    provide: CLOUDINARY,
    useFactory: () => {
        // Parse the CLOUDINARY_URL if present (format: cloudinary://key:secret@cloud_name)
        // Otherwise fall back to individual env vars
        const cloudinaryUrl = process.env.CLOUDINARY_URL;

        if (cloudinaryUrl) {
            // Let the SDK parse the URL automatically
            return cloudinary.config(cloudinaryUrl);
        }

        // Fallback to individual vars
        return cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dit3f8nov',
            api_key: process.env.API_Key || process.env.CLOUDINARY_API_KEY || '246917557432566',
            api_secret: process.env.API_Secret || process.env.CLOUDINARY_API_SECRET || 'g48zh9huyNZXfpws3N2oPQakDKQ',
        });
    },
};
