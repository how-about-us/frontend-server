export type ScheduleItem = {
  time: string;
  title: string;
  detail: string;
};

/** 일정 카드(시간표) 목업 — 스케줄 뷰 등에서 사용 */
export const MOCK_SCHEDULE_ITEMS: ScheduleItem[] = [
  { time: "09:00", title: "히코네성 산책", detail: "도보 15분" },
  { time: "12:30", title: "점심 - 오미규 덮밥", detail: "예약 완료" },
  { time: "15:00", title: "카페 휴식", detail: "북마크한 장소" },
];

/** 플랜 경로의 장소 한 곳 — 이동 시간은 배열 순서와 별도 lookup으로 계산 */
export type PlanPlace = {
  id: string;
  title: string;
  subtitle?: string;
};

export const MOCK_PLAN_PLACES: PlanPlace[] = [
  { id: "1", title: "남산타워", subtitle: "서울 랜드마크" },
  { id: "2", title: "명동", subtitle: "쇼핑 · 먹거리" },
  { id: "3", title: "경복궁", subtitle: "궁궐 산책" },
];

/** 일차별 플랜 — 각 일은 독립된 `PlanItinerary` 상태로 쓰인다 */
export type PlanDayData = {
  id: string;
  dayLabel: string;
  dateLabel: string;
  places: PlanPlace[];
};

export const MOCK_PLAN_DAYS: PlanDayData[] = [
  {
    id: "day-1",
    dayLabel: "1일차",
    dateLabel: "4월 12일 (토)",
    places: [
      { id: "1", title: "남산타워", subtitle: "서울 랜드마크" },
      { id: "2", title: "명동", subtitle: "쇼핑 · 먹거리" },
      { id: "3", title: "경복궁", subtitle: "궁궐 산책" },
    ],
  },
  {
    id: "day-2",
    dayLabel: "2일차",
    dateLabel: "4월 13일 (일)",
    places: [
      { id: "4", title: "북촌 한옥마을", subtitle: "골목 산책" },
      { id: "5", title: "인사동", subtitle: "기념품 · 전통차" },
    ],
  },
  {
    id: "day-3",
    dayLabel: "3일차",
    dateLabel: "4월 14일 (월)",
    places: [{ id: "6", title: "홍대", subtitle: "저녁 · 공연" }],
  },
];
