"use client";

import type { ReactNode } from "react";

/**
 * 로그인·보호 라우트 판별은 미들웨어(`AUTH_SESSION_COOKIE`)에서 처리합니다.
 * 방 ID 유무로 `/home` 등으로 내보내지 않습니다.
 */
export function MainRoomGate({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
