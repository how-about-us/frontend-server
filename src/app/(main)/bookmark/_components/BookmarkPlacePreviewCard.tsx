"use client";

import { MapPin } from "lucide-react";

import { usePlacePhotoUrlQuery } from "@/hooks/usePlacePhotoUrl";
import { MAIN_CARD_INNER_PADDING_X_CLASS } from "@/lib/layout-tokens";
import { cn } from "@/lib/utils";

export type BookmarkPlacePreviewCardProps = {
  name: string;
  address?: string;
  photoName?: string;
  primaryTypeDisplayName?: string;
  onClick?: () => void;
  className?: string;
  contentClassName?: string;
};

export function BookmarkPlacePreviewCard({
  name,
  address,
  photoName,
  primaryTypeDisplayName,
  onClick,
  className,
  contentClassName,
}: BookmarkPlacePreviewCardProps) {
  const { data: imageUrl } = usePlacePhotoUrlQuery(photoName, "CARD");

  return (
    <article
      className={cn(
        "flex items-center gap-3 bg-white transition-colors",
        "border-b border-gray-border py-2 hover:bg-gray-50 active:bg-gray-100",
        MAIN_CARD_INNER_PADDING_X_CLASS,
        className,
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      style={onClick ? { cursor: "pointer" } : undefined}
    >
      <div className={cn("min-w-0 flex-1", contentClassName)}>
        <div className="flex items-baseline gap-1.5">
          <h3 className="truncate text-[17px] font-semibold leading-5 tracking-tight text-brand-green">
            {name}
          </h3>
          {primaryTypeDisplayName ? (
            <span className="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs font-medium leading-none text-dark-gray">
              {primaryTypeDisplayName}
            </span>
          ) : null}
        </div>
        {address ? (
          <div className="mt-1 flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0 text-[#99A1AF]" />
            <span className="truncate text-[13px] leading-relaxed text-[#99A1AF]">
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
