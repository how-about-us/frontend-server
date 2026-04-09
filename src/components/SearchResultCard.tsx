import { Star } from "lucide-react";

export type SearchResultCardProps = {
  name: string;
  category: string;
  description: string;
  rating: number;
  isOpen: boolean;
  reviewCount: number;
  images: string[];
};

export function SearchResultCard({
  name,
  category,
  description,
  rating,
  isOpen,
  reviewCount,
  images,
}: SearchResultCardProps) {
  return (
    <article className="overflow-hidden border-b border-gray-border bg-white">
      <div className="flex flex-col gap-0.5 px-3 pt-3.5">
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

      {images.length > 0 && (
        <div className="mt-1 flex gap-1 overflow-x-auto px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((src, i) => (
            <div
              key={i}
              className={`h-[142px] w-28 flex-shrink-0 overflow-hidden bg-light-gray ${
                i === 0 ? "rounded-l-[10px]" : ""
              } ${i === images.length - 1 ? "rounded-r-[10px]" : ""}
              }`}
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
      )}
    </article>
  );
}
