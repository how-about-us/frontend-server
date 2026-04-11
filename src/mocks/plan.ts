/** 플랜 경로의 장소 한 곳 — 이동 시간은 배열 순서와 별도 lookup으로 계산 */
export type PlanPlace = {
  id: string;
  title: string;
  /** 짧은 부제 또는 긴 설명(여러 줄) */
  subtitle?: string;
  imageUrl?: string;
};

/** 일차별 플랜 — `PlanPageView`가 일차별 장소 배열을 들고 `PlanItinerary`에 넘긴다 */
export type PlanDayData = {
  id: string;
  dayLabel: string;
  dateLabel: string;
  places: PlanPlace[];
};
