import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { RoomDetail } from "@/lib/api/rooms";

export interface SessionUser {
  id: number;
  email: string;
  nickname: string;
  profileImageUrl: string | null;
  provider: string;
}

/** localStorage persist v1 — PII(`user`) 없음 */
type PersistedSessionV1 = {
  currentRoomId: string | null;
};

type PersistedSessionV0 = {
  user?: SessionUser | null;
  currentRoomId?: string | null;
};

interface SessionStore {
  user: SessionUser | null;
  setUser: (user: SessionUser) => void;
  clearUser: () => void;
  /** `reconcileClientSession` 완료 후 true — persist 대상 아님 */
  sessionReady: boolean;
  setSessionReady: (ready: boolean) => void;
  /** 마지막으로 입장한 방 ID — localStorage에 저장되어 새로고침 후에도 유지됩니다. */
  currentRoomId: string | null;
  setCurrentRoomId: (id: string) => void;
  clearCurrentRoomId: () => void;
  /** 현재 방의 초대 코드 — 방 생성/재발급 시 갱신됩니다. */
  currentRoomInviteCode: string | null;
  setCurrentRoomInviteCode: (code: string) => void;
  clearCurrentRoomInviteCode: () => void;
  /** 현재 참여 중인 방의 메타데이터 (방 상세 조회 후 저장) */
  currentRoomMeta: RoomDetail | null;
  setCurrentRoomMeta: (meta: RoomDetail) => void;
  clearCurrentRoomMeta: () => void;
  /** 방장 전용: 현재 방의 미처리 입장 요청 수 */
  pendingJoinRequestsCount: number;
  setPendingJoinRequestsCount: (count: number) => void;
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () =>
        set({
          user: null,
          sessionReady: false,
          currentRoomId: null,
          currentRoomInviteCode: null,
          currentRoomMeta: null,
          pendingJoinRequestsCount: 0,
        }),
      sessionReady: false,
      setSessionReady: (ready) => set({ sessionReady: ready }),
      currentRoomId: null,
      setCurrentRoomId: (id) => set({ currentRoomId: id }),
      clearCurrentRoomId: () => set({ currentRoomId: null }),
      currentRoomInviteCode: null,
      setCurrentRoomInviteCode: (code) => set({ currentRoomInviteCode: code }),
      clearCurrentRoomInviteCode: () => set({ currentRoomInviteCode: null }),
      currentRoomMeta: null,
      setCurrentRoomMeta: (meta) => set({ currentRoomMeta: meta }),
      clearCurrentRoomMeta: () => set({ currentRoomMeta: null }),
      pendingJoinRequestsCount: 0,
      setPendingJoinRequestsCount: (count) =>
        set({ pendingJoinRequestsCount: count }),
    }),
    {
      name: "hau:session",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentRoomId: state.currentRoomId,
      }),
      migrate: (persisted, version): PersistedSessionV1 => {
        if (version === 0) {
          const old = persisted as PersistedSessionV0;
          return { currentRoomId: old.currentRoomId ?? null };
        }
        return persisted as PersistedSessionV1;
      },
      /** 자동 hydrate와 첫 렌더·Gate 타이밍 경쟁을 피함 — 클라에서만 `rehydrate()` 호출 */
      skipHydration: true,
    },
  ),
);
