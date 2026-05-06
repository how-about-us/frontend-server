export const scheduleItemsQueryKey = (roomId: string | null, scheduleId: number | null) =>
  ["schedule-items", roomId, scheduleId, "v2-loc"] as const;
