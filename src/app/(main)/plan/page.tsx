"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { PlanPageView } from "./_components/itinerary/PlanPageView";
import { useCurrentRoomId } from "@/hooks/use-room-id";

/** `/plan` — sessionStorage·스토어에 roomId가 있을 때만 플랜 표시, 없으면 홈 */
export default function PlanPage() {
  const router = useRouter();
  const { roomId, roomContextReady } = useCurrentRoomId();

  useEffect(() => {
    if (!roomContextReady || roomId) return;
    router.replace("/home");
  }, [roomContextReady, roomId, router]);

  if (!roomId) {
    return null;
  }

  return <PlanPageView />;
}
