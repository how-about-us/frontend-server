import { create } from "zustand";
import type { RoomDetail } from "@/lib/api/rooms";
import {
  clearCurrentRoomIdSessionStorage,
  readCurrentRoomIdFromSessionStorage,
  writeCurrentRoomIdToSessionStorage,
} from "@/lib/session-room-storage";

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
  /** `reconcileClientSession` 완료 후 true */
  sessionReady: boolean;
  setSessionReady: (ready: boolean) => void;
  /** 현재 방 ID — 메모리 + sessionStorage(탭 수명) */
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

export const useSessionStore = create<SessionStore>()((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => {
    clearCurrentRoomIdSessionStorage();
    set({
      user: null,
      sessionReady: false,
      currentRoomId: null,
      currentRoomInviteCode: null,
      currentRoomMeta: null,
      pendingJoinRequestsCount: 0,
    });
  },
  sessionReady: false,
  setSessionReady: (ready) => set({ sessionReady: ready }),
  currentRoomId: null,
  setCurrentRoomId: (id) => {
    const trimmed = typeof id === "string" ? id.trim() : "";
    if (trimmed.length > 0) {
      writeCurrentRoomIdToSessionStorage(trimmed);
      set({ currentRoomId: trimmed });
    } else {
      clearCurrentRoomIdSessionStorage();
      set({ currentRoomId: null });
    }
  },
  clearCurrentRoomId: () => {
    clearCurrentRoomIdSessionStorage();
    set({ currentRoomId: null });
  },
  currentRoomInviteCode: null,
  setCurrentRoomInviteCode: (code) => set({ currentRoomInviteCode: code }),
  clearCurrentRoomInviteCode: () => set({ currentRoomInviteCode: null }),
  currentRoomMeta: null,
  setCurrentRoomMeta: (meta) => set({ currentRoomMeta: meta }),
  clearCurrentRoomMeta: () => set({ currentRoomMeta: null }),
  pendingJoinRequestsCount: 0,
  setPendingJoinRequestsCount: (count) =>
    set({ pendingJoinRequestsCount: count }),
}));

/** sessionStorage 방 ID를 Zustand에 동기 시드 */
export function bootstrapCurrentRoomFromSessionStorage(): void {
  if (typeof window === "undefined") return;
  const roomId = readCurrentRoomIdFromSessionStorage();
  if (!roomId) return;

  const { currentRoomId, setCurrentRoomId } = useSessionStore.getState();
  if (currentRoomId?.trim() !== roomId) {
    setCurrentRoomId(roomId);
  }
}
