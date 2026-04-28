"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { PhotoLightbox } from "./PhotoLightbox";

type Props = {
  photoUrls: string[];
  isLoading: boolean;
  fallbackImage?: string;
};

export function PhotosTab({ photoUrls, isLoading, fallbackImage }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16">
        <Loader2 className="h-5 w-5 animate-spin text-brand-green" />
        <span className="text-[11px] text-dark-gray">사진 불러오는 중...</span>
      </div>
    );
  }

  const photos =
    photoUrls.length > 0 ? photoUrls : fallbackImage ? [fallbackImage] : [];

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 py-16 text-dark-gray">
        <span className="text-sm">등록된 사진이 없습니다.</span>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-0.5 p-0.5">
        {photos.map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setLightboxIndex(i)}
            className="aspect-square overflow-hidden bg-light-gray"
            aria-label={`사진 ${i + 1} 크게 보기`}
          >
            <img
              src={src}
              alt={`사진 ${i + 1}`}
              className="h-full w-full object-cover transition-opacity hover:opacity-85"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          initialIndex={lightboxIndex}
          currentIndex={lightboxIndex}
          onChangeIndex={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
