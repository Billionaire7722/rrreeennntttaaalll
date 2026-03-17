"use client";

const SAFE_IMAGE_MIME_TYPES = new Set([
    "image/apng",
    "image/avif",
    "image/bmp",
    "image/gif",
    "image/jpeg",
    "image/png",
    "image/webp",
]);

const SAFE_IMAGE_DATA_URL = /^data:image\/(?:apng|avif|bmp|gif|jpeg|png|webp);base64,[a-z0-9+/=]+$/i;
const UNSAFE_IMAGE_EXTENSION = /\.svg(?:$|[?#])/i;

export const SAFE_IMAGE_ACCEPT = Array.from(SAFE_IMAGE_MIME_TYPES).join(",");

export function isSafeImageFile(file: File) {
    return SAFE_IMAGE_MIME_TYPES.has(file.type);
}

type SafeImageUrlOptions = {
    allowBlob?: boolean;
    fallback?: string;
};

export function getSafeImageUrl(
    value: string | null | undefined,
    options: SafeImageUrlOptions = {},
) {
    const { allowBlob = false, fallback = "/images/defaultimage.jpg" } = options;
    const rawValue = typeof value === "string" ? value.trim() : "";

    if (!rawValue) return fallback;

    if (allowBlob && rawValue.startsWith("blob:")) {
        return rawValue;
    }

    if (SAFE_IMAGE_DATA_URL.test(rawValue)) {
        return rawValue;
    }

    if (rawValue.startsWith("/") && !rawValue.startsWith("//")) {
        return UNSAFE_IMAGE_EXTENSION.test(rawValue) ? fallback : rawValue;
    }

    try {
        const parsed = new URL(rawValue);
        if (!["http:", "https:"].includes(parsed.protocol)) {
            return fallback;
        }

        if (UNSAFE_IMAGE_EXTENSION.test(parsed.pathname)) {
            return fallback;
        }

        return parsed.toString();
    } catch {
        return fallback;
    }
}

