"use client";

import { Star, MapPin } from "lucide-react";

export type SearchResultCardProps = {
  name: string;
  /** 사람이 읽기 좋은 장소 유형 (e.g. "음식점") */
  category: string;
  /** AI 생성 리뷰 요약 */
  reviewSummary?: string | null;
  rating: number | null;
  userRatingCount?: number | null;
  isOpen?: boolean | null;
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
  rating,
  userRatingCount,
  isOpen,
  image,
  address,
  onClick,
}: SearchResultCardProps & { onClick?: () => void }) {
  return (
    <article
      className="flex items-start gap-3 border-b border-gray-border bg-white px-4 py-3.5 transition-colors hover:bg-gray-50 active:bg-gray-100"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      style={onClick ? { cursor: "pointer" } : undefined}
    >
      {/* Text content */}
      <div className="min-w-0 flex-1">
        {/* 이름 + 유형 */}
        <div className="flex items-baseline gap-1.5">
          <h3 className="truncate text-sm font-semibold leading-5 tracking-tight text-brand-green">
            {name}
          </h3>
          {category && (
            <span className="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium leading-none text-dark-gray">
              {category}
            </span>
          )}
        </div>

        {/* 별점 + 리뷰 수 + 영업 상태 */}
        <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <Star className="h-3 w-3 fill-[#FDC700] text-[#FDC700]" />
          <span className="text-[11px] font-medium leading-relaxed text-[#364153]">
            {rating != null ? rating.toFixed(1) : "-"}
          </span>
          {userRatingCount != null && (
            <span className="text-[11px] leading-relaxed text-[#99A1AF]">
              ({userRatingCount.toLocaleString()})
            </span>
          )}
          {isOpen !== undefined && (
            <span
              className={`text-[11px] font-medium leading-relaxed ${
                isOpen ? "text-brand-green" : "text-[#FF6467]"
              }`}
            >
              · {isOpen ? "영업 중" : "영업 종료"}
            </span>
          )}
        </div>

        {/* 주소 */}
        {address && (
          <div className="mt-1 flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0 text-[#99A1AF]" />
            <span className="truncate text-[11px] leading-relaxed text-[#99A1AF]">
              {address}
            </span>
          </div>
        )}
      </div>

      {/* Thumbnail */}
      <div className="h-[80px] w-[80px] shrink-0 overflow-hidden rounded-xl bg-light-gray">
        {image ? (
          <img
            src={image}
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
