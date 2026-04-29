import { MapPin, Clock, Phone, Globe } from "lucide-react";

type Props = {
  isOpen?: boolean | null;
  address?: string;
  phone?: string;
  hours?: string;
  website?: string;
  reviewSummary?: string | null;
};

export function HomeTab({ isOpen, address, phone, hours, website, reviewSummary }: Props) {
  return (
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
            <Clock className="mt-1.5 h-3.5 w-3.5 shrink-0 text-dark-gray" />
            <div className="flex-1">
              {isOpen != null && (
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

      {reviewSummary && (
        <div className="mt-4 rounded-xl bg-gray-50 px-3 py-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-dark-gray">
            AI 리뷰 요약
          </p>
          <p className="text-[11px] leading-relaxed text-[#364153]">
            {reviewSummary}
          </p>
        </div>
      )}
    </div>
  );
}
