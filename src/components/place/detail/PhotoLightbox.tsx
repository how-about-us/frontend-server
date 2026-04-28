"use client";

import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

type Props = {
  photos: string[];
  initialIndex: number;
  currentIndex: number;
  onChangeIndex: (index: number) => void;
  onClose: () => void;
};

export function PhotoLightbox({
  photos,
  currentIndex,
  onChangeIndex,
  onClose,
}: Props) {
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  const prev = useCallback(() => {
    if (hasPrev) onChangeIndex(currentIndex - 1);
  }, [hasPrev, currentIndex, onChangeIndex]);

  const next = useCallback(() => {
    if (hasNext) onChangeIndex(currentIndex + 1);
  }, [hasNext, currentIndex, onChangeIndex]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  // Prevent body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        aria-label="닫기"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Counter */}
      <span className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
        {currentIndex + 1} / {photos.length}
      </span>

      {/* Prev */}
      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          aria-label="이전 사진"
          className="absolute left-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/25"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Image */}
      <div
        className="flex max-h-[90vh] max-w-[90vw] items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          key={currentIndex}
          src={photos[currentIndex]}
          alt={`사진 ${currentIndex + 1}`}
          className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
          draggable={false}
        />
      </div>

      {/* Next */}
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          aria-label="다음 사진"
          className="absolute right-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/25"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
          {photos.map((src, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); onChangeIndex(i); }}
              className={`h-10 w-10 overflow-hidden rounded transition-opacity ${
                i === currentIndex
                  ? "opacity-100 ring-2 ring-white"
                  : "opacity-50 hover:opacity-80"
              }`}
              aria-label={`사진 ${i + 1}`}
            >
              <img
                src={src}
                alt={`썸네일 ${i + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}
