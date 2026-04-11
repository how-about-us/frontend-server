"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import { Star } from "lucide-react";

export type SearchResultCardProps = {
  name: string;
  category: string;
  description: string;
  rating: number;
  isOpen: boolean;
  reviewCount: number;
  images: string[];
  address?: string;
  phone?: string;
  hours?: string;
  website?: string;
};

function ImageCarousel({ images, name }: { images: string[]; name: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(images.length > 1);

  const SCROLL_AMOUNT = 120;

  function updateScrollState() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }

  function scroll(direction: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === "right" ? SCROLL_AMOUNT : -SCROLL_AMOUNT,
      behavior: "smooth",
    });
  }

  return (
    <div className="relative mt-1">
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className="flex gap-0.5 overflow-x-auto px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((src, i) => (
          <div
            key={i}
            className={`h-[102px] w-[82px] flex-shrink-0 overflow-hidden bg-light-gray ${
              i === 0 ? "rounded-l-[10px]" : ""
            } ${i === images.length - 1 ? "rounded-r-[10px]" : ""}`}
          >
            <img
              src={src}
              alt={`${name} ${i + 1}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>
      {/* 좌우 이동 버튼 */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            scroll("left");
          }}
          className="absolute opacity-80 hover:opacity-100 left-1 top-1/2 -translate-y-[calc(50%+8px)] flex h-7 w-7 items-center justify-center rounded-full bg-white "
          aria-label="이전 이미지"
        >
          <ChevronLeft className="h-4 w-4 text-dark-gray" />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            scroll("right");
          }}
          className="absolute opacity-85 hover:opacity-100 right-1 top-1/2 -translate-y-[calc(50%+8px)] flex h-7 w-7 items-center justify-center rounded-full bg-white "
          aria-label="다음 이미지"
        >
          <ChevronRight className="h-4 w-4 text-dark-gray" />
        </button>
      )}
    </div>
  );
}

export function SearchResultCard({
  name,
  category,
  description,
  rating,
  isOpen,
  reviewCount,
  images,
  onClick,
}: SearchResultCardProps & { onClick?: () => void }) {
  return (
    <article
      className="overflow-hidden border-b border-gray-border bg-white transition-colors hover:bg-gray-50 active:bg-gray-100"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      style={onClick ? { cursor: "pointer" } : undefined}
    >
      <div className="flex flex-col gap-0.5 px-4 pt-3.5">
        <div className="flex items-baseline gap-1.5">
          <h3 className="text-sm font-semibold leading-5 tracking-tight text-brand-green">
            {name}
          </h3>
          <span className="text-[11px] leading-relaxed text-dark-gray">
            {category}
          </span>
        </div>
        <p className="truncate text-[11px] leading-[1.625] text-dark-gray">
          {description}
        </p>
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 fill-[#FDC700] text-[#FDC700]" />
          <span className="text-[11px] leading-relaxed text-[#364153]">
            {rating}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className={`text-[11px] leading-relaxed ${
              isOpen ? "text-brand-green" : "text-[#FF6467]"
            }`}
          >
            {isOpen ? "영업 중" : "영업 종료"}
          </span>
          <span className="text-[11px] leading-relaxed text-[#99A1AF]">
            · 리뷰 {reviewCount.toLocaleString()}
          </span>
        </div>
      </div>

      {images.length > 0 && <ImageCarousel images={images} name={name} />}
    </article>
  );
}
