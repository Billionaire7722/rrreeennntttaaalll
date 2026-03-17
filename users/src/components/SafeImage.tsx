"use client";

import type { ImgHTMLAttributes } from "react";
import { getSafeImageUrl } from "@/utils/safeMedia";

type SafeImageProps = ImgHTMLAttributes<HTMLImageElement> & {
    fallbackSrc?: string;
    allowBlob?: boolean;
};

export default function SafeImage({
    src,
    fallbackSrc = "/images/defaultimage.jpg",
    allowBlob = false,
    ...props
}: SafeImageProps) {
    const safeSrc = getSafeImageUrl(typeof src === "string" ? src : undefined, {
        allowBlob,
        fallback: fallbackSrc,
    });

    return <img {...props} src={safeSrc} />;
}

