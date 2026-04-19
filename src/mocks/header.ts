export type TripInfo = {
  id: string;
  title: string;
  date: string;
};

export const MOCK_TRIP_INFO: TripInfo[] = [
  { id: "trip-hikone", title: "히코네 여행", date: "금요일, 4월 3일" },
  { id: "trip-kyoto", title: "교토 여행", date: "토요일, 4월 4일" },
];
