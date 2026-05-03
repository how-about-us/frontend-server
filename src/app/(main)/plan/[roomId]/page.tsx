"use client";

import { Suspense, useLayoutEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import { useSessionStore } from "@/stores/session-store";

function PlanRoomMigrateContent() {
  const params = useParams();
  const router = useRouter();
  const setCurrentRoomId = useSessionStore((s) => s.setCurrentRoomId);

  const raw = params.roomId;
  const roomId =
    typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";

  useLayoutEffect(() => {
    if (roomId) setCurrentRoomId(roomId);
    router.replace("/plan");
  }, [roomId, router, setCurrentRoomId]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center pl-6 pr-6">
      <p className="text-sm text-dark-gray">플래너로 이동 중…</p>
    </div>
  );
}

export default function PlanRoomLegacyPage() {
  return (
    <Suspense fallback={null}>
      <PlanRoomMigrateContent />
    </Suspense>
  );
}
