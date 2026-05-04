import { create } from "zustand";

/** STOMP 일정 브로드캐스트 중 지도 경로(polyline) 갱신에만 쓰이는 카운터(방별). */
type EpochState = {
  epochByRoomId: Record<string, number>;
  bumpForDirections: (roomId: string) => void;
};

export const usePlanMapDirectionsEpochStore = create<EpochState>((set) => ({
  epochByRoomId: {},
  bumpForDirections: (roomId) => {
    const rid = String(roomId ?? "").trim();
    if (!rid.length) return;
    set((s) => ({
      epochByRoomId: {
        ...s.epochByRoomId,
        [rid]: (s.epochByRoomId[rid] ?? 0) + 1,
      },
    }));
  },
}));
