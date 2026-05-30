"use client";

import { RoomTripEditForm } from "@/components/rooms/RoomTripEditForm";
import { useCurrentRoomMembership } from "@/hooks/useCurrentRoomMembership";

export function RoomTripSettingsSection() {
  const { roomId, roomSource, isHost, isLoading } = useCurrentRoomMembership();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-border border-t-brand-red" />
      </div>
    );
  }

  if (!roomSource || !roomId) {
    return (
      <p className="py-10 text-center text-sm text-dark-gray">
        여행 정보를 불러오지 못했어요.
      </p>
    );
  }

  return (
    <div className="flex min-w-0 w-full flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold text-black">여행 정보 수정</h1>
        {!isHost && (
          <p className="mt-1 text-xs text-dark-gray">
            방장만 여행 정보를 수정할 수 있어요.
          </p>
        )}
      </div>

      <RoomTripEditForm room={roomSource} readOnly={!isHost} />
    </div>
  );
}
