import { create } from "zustand";

/** 방별 STOMP presence로 추적하는 온라인 멤버 (키: roomId → userId) */
type OnlineByRoom = Record<string, Record<number, true>>;

interface RoomPresenceStore {
  onlineByRoom: OnlineByRoom;
  setUserOnline: (roomId: string, userId: number) => void;
  setUserOffline: (roomId: string, userId: number) => void;
  resetRoom: (roomId: string) => void;
  clearAll: () => void;
}

export const useRoomPresenceStore = create<RoomPresenceStore>((set) => ({
  onlineByRoom: {},
  setUserOnline: (roomId, userId) =>
    set((s) => ({
      onlineByRoom: {
        ...s.onlineByRoom,
        [roomId]: { ...s.onlineByRoom[roomId], [userId]: true },
      },
    })),
  setUserOffline: (roomId, userId) =>
    set((s) => {
      const room = s.onlineByRoom[roomId];
      if (!room?.[userId]) return s;
      const nextRoom = { ...room };
      delete nextRoom[userId];
      const nextGlobal = { ...s.onlineByRoom };
      if (Object.keys(nextRoom).length === 0) {
        delete nextGlobal[roomId];
      } else {
        nextGlobal[roomId] = nextRoom;
      }
      return { onlineByRoom: nextGlobal };
    }),
  resetRoom: (roomId) =>
    set((s) => {
      if (!s.onlineByRoom[roomId]) return s;
      const next = { ...s.onlineByRoom };
      delete next[roomId];
      return { onlineByRoom: next };
    }),
  clearAll: () => set({ onlineByRoom: {} }),
}));
