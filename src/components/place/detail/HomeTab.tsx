import { MapPin, Clock, Phone, Globe, ChevronRight } from "lucide-react";
import { StarRow } from "./StarRow";
import { MOCK_REVIEWS } from "./types";

type Props = {
  isOpen?: boolean;
  address?: string;
  phone?: string;
  hours?: string;
  website?: string;
  rating: number;
  reviewCount?: number;
};

export function HomeTab({
  isOpen,
  address,
  phone,
  hours,
  website,
  rating,
  reviewCount,
}: Props) {
  return (
    <div>
      <div className="border-b border-gray-border px-4 py-3">
        <h3 className="mb-2.5 text-[11px] font-semibold text-[#364153]">
          기본 정보
        </h3>
        <ul className="space-y-3">
          {address && (
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-dark-gray" />
              <span className="text-[11px] leading-relaxed text-[#364153]">
                {address}
              </span>
            </li>
          )}
          {hours && (
            <li className="flex items-start gap-3">
              <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-dark-gray" />
              <div className="flex-1">
                {isOpen !== undefined && (
                  <span
                    className={`text-[11px] font-medium ${
                      isOpen ? "text-brand-green" : "text-[#FF6467]"
                    }`}
                  >
                    {isOpen ? "영업 중" : "영업 종료"}
                  </span>
                )}
                <p className="mt-0.5 whitespace-pre-line text-[11px] leading-relaxed text-dark-gray">
                  {hours}
                </p>
              </div>
            </li>
          )}
          {phone && (
            <li className="flex items-center gap-3">
              <Phone className="h-3.5 w-3.5 shrink-0 text-dark-gray" />
              <a
                href={`tel:${phone}`}
                className="text-[11px] text-[#364153] underline-offset-2 hover:underline"
              >
                {phone}
              </a>
            </li>
          )}
          {website && (
            <li className="flex items-center gap-3">
              <Globe className="h-3.5 w-3.5 shrink-0 text-dark-gray" />
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-[11px] text-[#364153] underline-offset-2 hover:underline"
              >
                {website.replace(/^https?:\/\//, "")}
              </a>
            </li>
          )}
        </ul>
      </div>

      <div className="border-b border-gray-border px-4 py-3">
        <div className="mb-2.5 flex items-center justify-between">
          <h3 className="text-[11px] font-semibold text-[#364153]">리뷰</h3>
          <button className="flex items-center gap-0.5 text-[11px] text-dark-gray">
            전체보기
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xl font-bold text-[#364153]">{rating}</span>
          <div>
            <StarRow rating={rating} />
            {reviewCount !== undefined && (
              <p className="mt-0.5 text-[10px] text-dark-gray">
                리뷰 {reviewCount.toLocaleString()}개
              </p>
            )}
          </div>
        </div>
        <div className="space-y-3">
          {MOCK_REVIEWS.slice(0, 2).map((review) => (
            <div key={review.id} className="flex gap-2.5">
              <img
                src={review.avatar}
                alt={review.author}
                className="h-7 w-7 shrink-0 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-[#364153]">
                    {review.author}
                  </span>
                  <StarRow rating={review.rating} />
                  <span className="ml-auto text-[10px] text-dark-gray">
                    {review.date}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-dark-gray">
                  {review.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
