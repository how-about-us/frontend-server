import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface SessionUser {
  id: number;
  email: string;
  nickname: string;
  profileImageUrl: string | null;
  provider: string;
}

interface SessionStore {
  user: SessionUser | null;
  setUser: (user: SessionUser) => void;
  clearUser: () => void;
  /** 마지막으로 입장한 방 ID — localStorage에 저장되어 새로고침 후에도 유지됩니다. */
  currentRoomId: string | null;
  setCurrentRoomId: (id: string) => void;
  clearCurrentRoomId: () => void;
  /** 현재 방의 초대 코드 — 방 생성/재발급 시 갱신됩니다. */
  currentRoomInviteCode: string | null;
  setCurrentRoomInviteCode: (code: string) => void;
  clearCurrentRoomInviteCode: () => void;
  /** 방장 전용: 현재 방의 미처리 입장 요청 수 */
  pendingJoinRequestsCount: number;
  setPendingJoinRequestsCount: (count: number) => void;
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
      currentRoomId: null,
      setCurrentRoomId: (id) => set({ currentRoomId: id }),
      clearCurrentRoomId: () => set({ currentRoomId: null }),
      currentRoomInviteCode: null,
      setCurrentRoomInviteCode: (code) => set({ currentRoomInviteCode: code }),
      clearCurrentRoomInviteCode: () => set({ currentRoomInviteCode: null }),
      pendingJoinRequestsCount: 0,
      setPendingJoinRequestsCount: (count) =>
        set({ pendingJoinRequestsCount: count }),
    }),
    {
      name: "hau:session",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
      }),
    },
  ),
);
