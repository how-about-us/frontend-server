"use client";

import { Suspense, useLayoutEffect } from "react";
import { useParams } from "next/navigation";

import { PlanPageView } from "../_components/itinerary/PlanPageView";
import { usePlanItineraryExpandedStore } from "@/stores/plan-itinerary-expanded-store";
import { usePlanScheduleRouteVisibilityStore } from "@/stores/plan-schedule-route-visibility-store";
import { useSessionStore } from "@/stores/session-store";

function PlanRoomPageContent() {
  const params = useParams();
  const setCurrentRoomId = useSessionStore((s) => s.setCurrentRoomId);

  const raw = params.roomId;
  const roomId =
    typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";

  useLayoutEffect(() => {
    usePlanItineraryExpandedStore.getState().resetForRoomChange();
    usePlanScheduleRouteVisibilityStore.getState().resetForRoomChange();
    if (roomId.trim().length > 0) {
      setCurrentRoomId(roomId);
    }
  }, [roomId, setCurrentRoomId]);

  if (!roomId.trim().length) {
    return null;
  }

  return <PlanPageView />;
}

export default function PlanRoomPage() {
  return (
    <Suspense fallback={null}>
      <PlanRoomPageContent />
    </Suspense>
  );
}
