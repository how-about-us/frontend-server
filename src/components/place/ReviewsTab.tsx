import { ExternalLink } from "lucide-react";

import { StarRow } from "./StarRow";
import type { PlaceReview } from "./types";

type Props = {
  rating: number | null;
  userRatingCount?: number | null;
  reviews: PlaceReview[];
  reviewsUri?: string | null;
};

function ReviewsLink({ reviewsUri }: { reviewsUri?: string | null }) {
  if (!reviewsUri) {
    return null;
  }

  return (
    <a
      href={reviewsUri}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-green underline-offset-2 hover:underline"
    >
      리뷰 전체보기
      <ExternalLink className="h-3 w-3" aria-hidden="true" />
    </a>
  );
}

export function ReviewsTab({
  rating,
  userRatingCount,
  reviews,
  reviewsUri,
}: Props) {
  const starCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));
  const maxCount = Math.max(...starCounts.map((s) => s.count), 1);

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-5 py-16 text-center">
        <p className="text-[17px] font-medium text-[#364153]">등록된 리뷰가 없어요</p>
        <p className="text-[13px] text-dark-gray">
          아직 리뷰가 수집되지 않았습니다.
        </p>
        <ReviewsLink reviewsUri={reviewsUri} />
      </div>
    );
  }

  return (
    <div className="px-5 py-4">
      {rating != null && (
        <div className="mb-4 flex items-center gap-3">
          <div className="text-center">
            <p className="text-4xl font-bold text-[#364153]">
              {rating.toFixed(1)}
            </p>
            <StarRow rating={rating} />
            {userRatingCount != null && (
              <p className="mt-0.5 text-xs text-dark-gray">
                {userRatingCount.toLocaleString()}개
              </p>
            )}
          </div>
          <div className="flex-1">
            {starCounts.map(({ star, count }) => (
              <div key={star} className="flex items-center gap-1.5">
                <span className="w-3 text-right text-xs text-dark-gray">
                  {star}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-[#FDC700]"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {reviews.map((review, i) => (
          <div key={i} className="flex gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[14px] font-medium text-dark-gray">
              {review.authorDisplayName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-medium text-[#364153]">
                  {review.authorDisplayName}
                </span>
                <span className="text-xs text-dark-gray">
                  {review.relativePublishTimeDescription}
                </span>
              </div>
              <StarRow rating={review.rating} />
              <p className="mt-1 text-[13px] leading-relaxed text-dark-gray">
                {review.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      {reviewsUri && (
        <div className="mt-5 flex justify-center border-t border-gray-border pt-4">
          <ReviewsLink reviewsUri={reviewsUri} />
        </div>
      )}
    </div>
  );
}
