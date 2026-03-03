"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudinaryProvider = exports.CLOUDINARY = void 0;
const cloudinary_1 = require("cloudinary");
exports.CLOUDINARY = 'Cloudinary';
exports.CloudinaryProvider = {
    provide: exports.CLOUDINARY,
    useFactory: () => {
        if (process.env.SKIP_CLOUDINARY === 'true') {
            console.log('Cloudinary skipped for local development');
            return null;
        }
        const cloudinaryUrl = process.env.CLOUDINARY_URL;
        if (cloudinaryUrl) {
            return cloudinary_1.v2.config(cloudinaryUrl);
        }
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.API_Key || process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.API_Secret || process.env.CLOUDINARY_API_SECRET;
        if (!cloudName || !apiKey || !apiSecret) {
            throw new Error('Cloudinary config is missing. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY/API_Key + CLOUDINARY_API_SECRET/API_Secret.');
        }
        return cloudinary_1.v2.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret,
        });
    },
};
//# sourceMappingURL=cloudinary.provider.js.map