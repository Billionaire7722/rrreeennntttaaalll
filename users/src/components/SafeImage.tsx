"use client";
/* eslint-disable @next/next/no-img-element */

import type { CSSProperties, ImgHTMLAttributes } from "react";
import { getSafeImageUrl } from "@/utils/safeMedia";

type SafeImageProps = {
    src?: string | null;
    alt: string;
    className?: string;
    style?: CSSProperties;
    width?: number | string;
    height?: number | string;
    draggable?: boolean;
    loading?: ImgHTMLAttributes<HTMLImageElement>["loading"];
    decoding?: ImgHTMLAttributes<HTMLImageElement>["decoding"];
    sizes?: string;
    srcSet?: string;
    crossOrigin?: ImgHTMLAttributes<HTMLImageElement>["crossOrigin"];
    referrerPolicy?: ImgHTMLAttributes<HTMLImageElement>["referrerPolicy"];
    fetchPriority?: ImgHTMLAttributes<HTMLImageElement>["fetchPriority"];
    onLoad?: ImgHTMLAttributes<HTMLImageElement>["onLoad"];
    onError?: ImgHTMLAttributes<HTMLImageElement>["onError"];
    fallbackSrc?: string;
    allowBlob?: boolean;
};

export default function SafeImage({
    src,
    alt,
    className,
    style,
    width,
    height,
    draggable,
    loading,
    decoding,
    sizes,
    srcSet,
    crossOrigin,
    referrerPolicy,
    fetchPriority,
    onLoad,
    onError,
    fallbackSrc = "/images/defaultimage.jpg",
    allowBlob = false,
}: SafeImageProps) {
    const safeSrc = getSafeImageUrl(typeof src === "string" ? src : undefined, {
        allowBlob,
        fallback: fallbackSrc,
    });

    return (
        <img
            src={safeSrc}
            alt={alt}
            className={className}
            style={style}
            width={width}
            height={height}
            draggable={draggable}
            loading={loading}
            decoding={decoding}
            sizes={sizes}
            srcSet={srcSet}
            crossOrigin={crossOrigin}
            referrerPolicy={referrerPolicy}
            fetchPriority={fetchPriority}
            onLoad={onLoad}
            onError={onError}
        />
    );
}
