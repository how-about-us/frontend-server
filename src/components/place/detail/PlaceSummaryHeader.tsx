import { Star, Send, Calendar, Bookmark } from "lucide-react";

type Props = {
  name: string;
  category: string;
  reviewSummary?: string | null;
  rating: number | null;
  userRatingCount?: number | null;
};

export function PlaceSummaryHeader({
  name,
  category,
  reviewSummary,
  rating,
  userRatingCount,
}: Props) {
  return (
    <div className="border-b border-gray-border px-4 pb-4 pt-3">
      <div className="flex items-start justify-between gap-3">
        <h2 className="min-w-0 flex-1 leading-snug">
          <span className="block text-lg font-bold tracking-tight text-[#111827]">
            {name}
          </span>
          <span className="block text-sm font-normal text-[#6b7280]">
            {category}
          </span>
        </h2>
        <button
          type="button"
          className="flex shrink-0 flex-col items-center gap-0.5"
          aria-label="채팅으로 보내기"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#3b82f6] bg-white shadow-sm">
            <Send className="h-4 w-4 text-[#3b82f6]" strokeWidth={2} />
          </span>
          <span className="max-w-[72px] text-center text-[10px] leading-tight text-[#9ca3af]">
            채팅으로 보내기
          </span>
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px]">
        <Star className="h-4 w-4 shrink-0 fill-[#FDC700] text-[#FDC700]" />
        <span className="font-semibold text-[#364153]">
          {rating != null ? rating.toFixed(1) : "-"}
        </span>
        {userRatingCount != null && (
          <span className="text-[#9ca3af]">
            리뷰 {userRatingCount.toLocaleString()}개
          </span>
        )}
      </div>

      {reviewSummary && (
        <p className="mt-2.5 text-[11px] leading-relaxed text-[#6b7280]">
          {reviewSummary}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-red py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-red-600 active:bg-red-700"
        >
          <Calendar className="h-4 w-4" strokeWidth={2} />
          일정에 추가
        </button>
        <button
          type="button"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-border bg-white py-3 text-xs font-semibold text-[#111827] transition hover:bg-gray-50 active:bg-gray-100"
        >
          <Bookmark className="h-4 w-4" strokeWidth={2} />
          북마크에 추가
        </button>
      </div>
    </div>
  );
}
