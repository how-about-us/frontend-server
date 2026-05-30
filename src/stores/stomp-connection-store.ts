import { create } from "zustand";

export const STOMP_CONNECTION_ISSUE_MESSAGE =
  "실시간 연결을 복구하지 못했어요. 네트워크를 확인한 뒤 다시 시도해 주세요.";

interface StompConnectionStore {
  connectionIssue: string | null;
  autoRecoverySuspended: boolean;
  setConnectionIssue: (message: string) => void;
  clearConnectionIssue: () => void;
  resumeAutoRecovery: () => void;
}

export const useStompConnectionStore = create<StompConnectionStore>((set) => ({
  connectionIssue: null,
  autoRecoverySuspended: false,

  setConnectionIssue: (message) => {
    set({ connectionIssue: message, autoRecoverySuspended: true });
  },

  clearConnectionIssue: () => {
    set({ connectionIssue: null, autoRecoverySuspended: false });
  },

  resumeAutoRecovery: () => {
    set({ autoRecoverySuspended: false });
  },
}));

/** STOMP 복구 콜백 등 React 밖에서 자동 재시도 중단 여부 확인 */
export function isStompAutoRecoverySuspended(): boolean {
  return useStompConnectionStore.getState().autoRecoverySuspended;
}
