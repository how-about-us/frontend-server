export type ScheduleItem = {
  time: string;
  title: string;
  detail: string;
};

export const MOCK_SCHEDULE_ITEMS: ScheduleItem[] = [
  { time: "09:00", title: "히코네성 산책", detail: "도보 15분" },
  { time: "12:30", title: "점심 - 오미규 덮밥", detail: "예약 완료" },
  { time: "15:00", title: "카페 휴식", detail: "북마크한 장소" },
];
