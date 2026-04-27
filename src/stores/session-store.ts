import { create } from "zustand";

export interface SessionUser {
  name: string;
  email: string;
  avatarInitial: string;
}

interface SessionStore {
  user: SessionUser | null;
  setUser: (user: SessionUser) => void;
  clearUser: () => void;
  /** 마지막으로 열었던 방 ID — 사이드바 plan 링크에 사용 */
  currentRoomId: string | null;
  setCurrentRoomId: (id: string) => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  /**
   * BYPASS_AUTH=true 환경에서는 mock 유저를 기본값으로 사용.
   * 실제 로그인 연동 후에는 auth/callback 에서 setUser() 호출로 채워진다.
   */
  user: {
    name: "테스트 유저",
    email: "test@example.com",
    avatarInitial: "T",
  },
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
  currentRoomId: null,
  setCurrentRoomId: (id) => set({ currentRoomId: id }),
}));
