export const roomSchedulesQueryKey = (roomId: string | null) =>
  ["room-schedules", roomId] as const;
