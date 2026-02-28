"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudinaryProvider = exports.CLOUDINARY = void 0;
const cloudinary_1 = require("cloudinary");
exports.CLOUDINARY = 'Cloudinary';
exports.CloudinaryProvider = {
    provide: exports.CLOUDINARY,
    useFactory: () => {
        const cloudinaryUrl = process.env.CLOUDINARY_URL;
        if (cloudinaryUrl) {
            return cloudinary_1.v2.config(cloudinaryUrl);
        }
        return cloudinary_1.v2.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dit3f8nov',
            api_key: process.env.API_Key || process.env.CLOUDINARY_API_KEY || '246917557432566',
            api_secret: process.env.API_Secret || process.env.CLOUDINARY_API_SECRET || 'g48zh9huyNZXfpws3N2oPQakDKQ',
        });
    },
};
//# sourceMappingURL=cloudinary.provider.js.map