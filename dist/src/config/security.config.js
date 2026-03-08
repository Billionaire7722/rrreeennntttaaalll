"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllowedCorsOrigins = exports.getJwtSecretOrThrow = exports.isProduction = void 0;
exports.isProduction = process.env.NODE_ENV === 'production';
const getJwtSecretOrThrow = () => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret && exports.isProduction) {
        throw new Error('JWT_SECRET is required in production');
    }
    return jwtSecret || 'dev_only_jwt_secret';
};
exports.getJwtSecretOrThrow = getJwtSecretOrThrow;
const getAllowedCorsOrigins = () => {
    const raw = process.env.CORS_ORIGIN?.trim();
    if (!raw) {
        return exports.isProduction ? [] : ['*'];
    }
    return raw
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
};
exports.getAllowedCorsOrigins = getAllowedCorsOrigins;
//# sourceMappingURL=security.config.js.map