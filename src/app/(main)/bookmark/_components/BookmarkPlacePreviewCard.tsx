"use client";

import { MapPin } from "lucide-react";

import { usePlacePhotoUrlQuery } from "@/hooks/usePlacePhotoUrl";
import { cn } from "@/lib/utils";

export type BookmarkPlacePreviewCardProps = {
  name: string;
  address?: string;
  photoName?: string;
  onClick?: () => void;
  className?: string;
};

export function BookmarkPlacePreviewCard({
  name,
  address,
  photoName,
  onClick,
  className,
}: BookmarkPlacePreviewCardProps) {
  const { data: imageUrl } = usePlacePhotoUrlQuery(photoName);

  return (
    <article
      className={cn(
        "flex items-center gap-3 bg-white transition-colors",
        "border-b border-gray-border px-4 py-2 hover:bg-gray-50 active:bg-gray-100",
        className,
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      style={onClick ? { cursor: "pointer" } : undefined}
    >
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold leading-5 tracking-tight text-brand-green">
          {name}
        </h3>
        {address ? (
          <div className="mt-1 flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0 text-[#99A1AF]" />
            <span className="truncate text-[11px] leading-relaxed text-[#99A1AF]">
              {address}
            </span>
          </div>
        ) : null}
      </div>

      <div className="h-[80px] w-[80px] shrink-0 overflow-hidden rounded-lg bg-light-gray">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote place photo URL
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <MapPin className="h-6 w-6 text-gray-300" />
          </div>
        )}
      </div>
    </article>
  );
}
