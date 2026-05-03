/** 플랜 화면에서 쓰는 장소 한 건 — 서버 일정 항목과 매핑 가능 */
export type PlanPlace = {
  id: string;
  title: string;
  /** 짧은 부제 또는 긴 설명(여러 줄) */
  subtitle?: string;
  imageUrl?: string;
  /** 서버 일정 항목과 매핑 시 */
  itemId?: number;
  googlePlaceId?: string;
  /** 서버 일정 항목 — PATCH 시 사용 (`HH:mm` 등 API 그대로) */
  startTime?: string;
  durationMinutes?: number;
};

/** 일차별 플랜 메타 — 섹션 헤더용 (`places`는 현재 빈 배열) */
export type PlanDayData = {
  id: string;
  dayLabel: string;
  dateLabel: string;
  places: PlanPlace[];
};
