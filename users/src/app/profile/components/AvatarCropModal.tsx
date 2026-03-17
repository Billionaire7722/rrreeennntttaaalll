"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, ZoomIn } from "lucide-react";

const CROP_SIZE = 280;
const OUTPUT_SIZE = 512;
const MAX_ZOOM = 3;

type Offset = {
  x: number;
  y: number;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  origin: Offset;
};

interface AvatarCropModalProps {
  previewUrl: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: (blob: Blob) => Promise<void>;
  t: (key: string) => string;
}

export default function AvatarCropModal({
  previewUrl,
  isSubmitting,
  onCancel,
  onConfirm,
  t,
}: AvatarCropModalProps) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      setNaturalSize({ width: image.naturalWidth, height: image.naturalHeight });
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    image.src = previewUrl;
  }, [previewUrl]);

  const baseScale = useMemo(() => {
    if (!naturalSize.width || !naturalSize.height) return 1;
    return Math.max(CROP_SIZE / naturalSize.width, CROP_SIZE / naturalSize.height);
  }, [naturalSize.height, naturalSize.width]);

  const effectiveScale = baseScale * zoom;

  const clampOffset = (value: Offset, nextScale = effectiveScale) => {
    if (!naturalSize.width || !naturalSize.height) {
      return { x: 0, y: 0 };
    }

    const renderedWidth = naturalSize.width * nextScale;
    const renderedHeight = naturalSize.height * nextScale;
    const maxX = Math.max(0, (renderedWidth - CROP_SIZE) / 2);
    const maxY = Math.max(0, (renderedHeight - CROP_SIZE) / 2);

    return {
      x: Math.min(maxX, Math.max(-maxX, value.x)),
      y: Math.min(maxY, Math.max(-maxY, value.y)),
    };
  };

  useEffect(() => {
    setOffset((current) => clampOffset(current));
  }, [effectiveScale, naturalSize.height, naturalSize.width]);

  const renderedWidth = naturalSize.width * effectiveScale;
  const renderedHeight = naturalSize.height * effectiveScale;
  const imageLeft = (CROP_SIZE - renderedWidth) / 2 + offset.x;
  const imageTop = (CROP_SIZE - renderedHeight) / 2 + offset.y;

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!naturalSize.width || isSubmitting || isPreparing) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragState({
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: offset,
    });
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    const nextOffset = {
      x: dragState.origin.x + (event.clientX - dragState.startX),
      y: dragState.origin.y + (event.clientY - dragState.startY),
    };

    setOffset(clampOffset(nextOffset));
  };

  const stopDragging = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragState(null);
  };

  const handleZoomChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextZoom = Number(event.target.value);
    setZoom(nextZoom);
  };

  const handleSave = async () => {
    if (!imageRef.current || !naturalSize.width || !naturalSize.height) return;

    setIsPreparing(true);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Canvas context is unavailable");
      }

      const sourceX = Math.max(0, (0 - imageLeft) / effectiveScale);
      const sourceY = Math.max(0, (0 - imageTop) / effectiveScale);
      const sourceWidth = Math.min(naturalSize.width - sourceX, CROP_SIZE / effectiveScale);
      const sourceHeight = Math.min(naturalSize.height - sourceY, CROP_SIZE / effectiveScale);

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(
        imageRef.current,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        OUTPUT_SIZE,
        OUTPUT_SIZE
      );

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
          if (!result) {
            reject(new Error("Failed to create avatar preview"));
            return;
          }

          resolve(result);
        }, "image/jpeg", 0.92);
      });

      try {
        await onConfirm(blob);
      } catch {
        // The parent shows inline feedback and keeps the modal open for retry.
      }
    } finally {
      setIsPreparing(false);
    }
  };

  const isBusy = isSubmitting || isPreparing;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[var(--theme-surface)] p-5 shadow-[0_30px_120px_rgba(15,23,42,0.45)] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-[var(--theme-text)]">{t("profile.editProfile")}</h2>
            <p className="mt-2 text-sm text-[var(--theme-text-muted)]">Drag and zoom to frame your photo.</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            className="rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface-2)] px-3 py-2 text-sm font-semibold text-[var(--theme-text-muted)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("common.cancel")}
          </button>
        </div>

        <div className="mt-6 flex justify-center">
          <div
            className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 shadow-inner ${dragState ? "cursor-grabbing" : "cursor-grab"}`}
            style={{ width: CROP_SIZE, height: CROP_SIZE, touchAction: "none" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopDragging}
            onPointerCancel={stopDragging}
          >
            {naturalSize.width ? (
              <>
                <img
                  ref={imageRef}
                  src={previewUrl}
                  alt={t("profile.editProfile")}
                  className="absolute max-w-none select-none"
                  draggable={false}
                  style={{
                    width: renderedWidth,
                    height: renderedHeight,
                    left: imageLeft,
                    top: imageTop,
                  }}
                />
                <div className="pointer-events-none absolute inset-0 rounded-[2rem] border border-white/30" />
                <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                  {Array.from({ length: 9 }).map((_, index) => (
                    <div key={index} className="border border-white/10" />
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-sm font-semibold text-white/70">
                {t("common.loading")}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-[var(--theme-border)] bg-[var(--theme-surface-2)] p-4">
          <div className="flex items-center gap-3 text-sm font-semibold text-[var(--theme-text)]">
            <ZoomIn className="h-4 w-4 text-[var(--theme-text-muted)]" />
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <input
            type="range"
            min="1"
            max={String(MAX_ZOOM)}
            step="0.01"
            value={zoom}
            disabled={!naturalSize.width || isBusy}
            onChange={handleZoomChange}
            className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Avatar zoom"
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            className="flex-1 rounded-[1.25rem] border border-[var(--theme-border)] bg-[var(--theme-surface-2)] px-5 py-3 text-sm font-semibold text-[var(--theme-text)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!naturalSize.width || isBusy}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-[1.25rem] bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isBusy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("common.loading")}
              </>
            ) : (
              t("common.saveChanges")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
