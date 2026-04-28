import { StarRow } from "./StarRow";
import { MOCK_REVIEWS } from "./types";

type Props = {
  rating: number;
  reviewCount?: number;
};

export function ReviewsTab({ rating, reviewCount }: Props) {
  return (
    <div className="px-4 py-3">
      <div className="mb-4 flex items-center gap-3">
        <div className="text-center">
          <p className="text-3xl font-bold text-[#364153]">{rating}</p>
          <StarRow rating={rating} />
          {reviewCount !== undefined && (
            <p className="mt-0.5 text-[10px] text-dark-gray">
              {reviewCount.toLocaleString()}개
            </p>
          )}
        </div>
        <div className="flex-1">
          {[5, 4, 3, 2, 1].map((star) => {
            const pct =
              star === 5 ? 60 : star === 4 ? 25 : star === 3 ? 10 : star === 2 ? 3 : 2;
            return (
              <div key={star} className="flex items-center gap-1.5">
                <span className="w-3 text-right text-[10px] text-dark-gray">
                  {star}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-[#FDC700]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        {MOCK_REVIEWS.map((review) => (
          <div key={review.id} className="flex gap-2.5">
            <img
              src={review.avatar}
              alt={review.author}
              className="h-8 w-8 shrink-0 rounded-full object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-[#364153]">
                  {review.author}
                </span>
                <span className="text-[10px] text-dark-gray">{review.date}</span>
              </div>
              <StarRow rating={review.rating} />
              <p className="mt-1 text-[11px] leading-relaxed text-dark-gray">
                {review.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
