"use client";

import { usePathname } from "next/navigation";

import { resolveEffectiveMainRoomId } from "@/lib/main-room";
import { useSessionStore } from "@/stores/session-store";

/** (main) Shell·가드 등에서 동일 규칙으로 “현재 방” 식별 */
export function useEffectiveMainRoomId(): string | null {
  const pathname = usePathname();
  const storedRoomId = useSessionStore((s) => s.currentRoomId);
  return resolveEffectiveMainRoomId(pathname, storedRoomId);
}
