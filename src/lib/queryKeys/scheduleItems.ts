export const scheduleItemsQueryKey = (roomId: string | null, scheduleId: number | null) =>
  ["schedule-items", roomId, scheduleId] as const;
