"use client";

import { Star } from "lucide-react";

export type SearchResultCardProps = {
  name: string;
  category: string;
  description?: string;
  rating: number;
  isOpen?: boolean;
  reviewCount?: number;
  /** Single preview image URL from /places/photos */
  image?: string;
  address?: string;
  phone?: string;
  hours?: string;
  website?: string;
  /** Present when coming from real API; absent for mock/bookmark data */
  googlePlaceId?: string;
  /** Coordinates – present for real API results, used to pan the map */
  location?: { lat: number; lng: number };
};

export function SearchResultCard({
  name,
  category,
  description,
  rating,
  isOpen,
  reviewCount,
  image,
  onClick,
}: SearchResultCardProps & { onClick?: () => void }) {
  return (
    <article
      className="flex items-center gap-3 border-b border-gray-border bg-white px-4 py-3.5 transition-colors hover:bg-gray-50 active:bg-gray-100"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      style={onClick ? { cursor: "pointer" } : undefined}
    >
      {/* Text content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <h3 className="truncate text-sm font-semibold leading-5 tracking-tight text-brand-green">
            {name}
          </h3>
          <span className="shrink-0 text-[11px] leading-relaxed text-dark-gray">
            {category}
          </span>
        </div>

        {description && (
          <p className="mt-0.5 truncate text-[11px] leading-[1.625] text-dark-gray">
            {description}
          </p>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <Star className="h-3 w-3 fill-[#FDC700] text-[#FDC700]" />
          <span className="text-[11px] leading-relaxed text-[#364153]">
            {rating}
          </span>
          {isOpen !== undefined && (
            <span
              className={`text-[11px] leading-relaxed ${
                isOpen ? "text-brand-green" : "text-[#FF6467]"
              }`}
            >
              · {isOpen ? "영업 중" : "영업 종료"}
            </span>
          )}
          {reviewCount !== undefined && (
            <span className="text-[11px] leading-relaxed text-[#99A1AF]">
              · 리뷰 {reviewCount.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Thumbnail */}
      <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-light-gray">
        {image && (
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        )}
      </div>
    </article>
  );
}
