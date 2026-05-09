"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Calendar, X } from "lucide-react";

import { RoomListItem } from "@/lib/api/rooms";
import {
  resolveCoverPhotoNameFromPlaceId,
  resolveCoverPhotoNameFromSearch,
} from "@/hooks/useRoomCoverPhoto";
import { useUpdateRoom } from "@/hooks/useRooms";
import { roomCoverPhotoNameKey } from "@/lib/room-cover-query";
import { DestinationSearchInput } from "@/components/search/DestinationSearchInput";

type Props = {
  room: RoomListItem;
  onClose: () => void;
};

export function EditRoomModal({ room, onClose }: Props) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(room.title);
  const [destination, setDestination] = useState(room.destination);
  const [startDate, setStartDate] = useState(room.startDate ?? "");
  const [endDate, setEndDate] = useState(room.endDate ?? "");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [isResolvingCover, setIsResolvingCover] = useState(false);

  const { mutate: updateRoom, isPending, error } = useUpdateRoom();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const canSave =
    title.trim() && destination.trim() && !isPending && !isResolvingCover;

  async function handleSave() {
    if (!canSave) return;

    const destTrimmed = destination.trim();
    const prevDestTrimmed =
      typeof room.destination === "string" ? room.destination.trim() : "";
    const destChanged = destTrimmed !== prevDestTrimmed;

    setIsResolvingCover(true);
    let photoForCache: string | null | undefined;
    try {
      if (selectedPlaceId) {
        const fromPlace = await resolveCoverPhotoNameFromPlaceId(
          selectedPlaceId,
        );
        photoForCache =
          fromPlace ??
          (await resolveCoverPhotoNameFromSearch(destTrimmed));
      } else if (destChanged) {
        photoForCache = await resolveCoverPhotoNameFromSearch(destTrimmed);
      }
    } finally {
      setIsResolvingCover(false);
    }

    updateRoom(
      {
        roomId: room.id,
        data: {
          title: title.trim(),
          destination: destTrimmed,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      },
      {
        onSuccess: (updated) => {
          const finalDest =
            typeof updated.destination === "string"
              ? updated.destination.trim()
              : destTrimmed;

          if (destChanged && prevDestTrimmed.length > 0) {
            queryClient.removeQueries({
              queryKey: roomCoverPhotoNameKey(room.id, prevDestTrimmed),
            });
          }

          if (photoForCache !== undefined) {
            queryClient.setQueryData(
              roomCoverPhotoNameKey(room.id, finalDest),
              photoForCache,
            );
          }

          onClose();
        },
      },
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-border px-6 py-4">
          <h2 className="text-base font-bold">여행 수정</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-dark-gray transition hover:bg-bubble-gray"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3 px-6 py-5">
          <div className="rounded-2xl border-2 border-gray-border bg-white px-5 py-4 transition focus-within:border-brand-red">
            <p className="mb-1.5 text-sm font-bold text-black">여행 제목</p>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 봄 일본 여행"
              className="w-full text-sm text-dark-gray outline-none placeholder:text-light-gray"
              autoFocus
            />
          </div>

          <div className="rounded-2xl border-2 border-gray-border bg-white px-5 py-4 transition focus-within:border-brand-red">
            <p className="mb-1.5 text-sm font-bold text-black">어디로?</p>
            <DestinationSearchInput
              value={destination}
              onChange={setDestination}
              onResolvedPlace={(place) =>
                setSelectedPlaceId(place?.placeId ?? null)
              }
            />
          </div>

          <div className="rounded-2xl border-2 border-gray-border bg-white px-5 py-4 transition focus-within:border-brand-red">
            <p className="mb-2.5 text-sm font-bold text-dark-gray">날짜</p>
            <div className="flex items-center gap-3">
              <label className="flex flex-1 cursor-pointer items-center gap-2">
                <Calendar size={14} className="shrink-0 text-dark-gray" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-sm text-dark-gray outline-none"
                />
              </label>
              <span className="select-none text-light-gray">|</span>
              <label className="flex flex-1 cursor-pointer items-center gap-2">
                <Calendar size={14} className="shrink-0 text-dark-gray" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-sm text-dark-gray outline-none"
                />
              </label>
            </div>
          </div>

          {error && (
            <p className="text-center text-sm text-brand-red">
              수정에 실패했어요. 다시 시도해주세요.
            </p>
          )}
        </div>

        <div className="flex gap-2 border-t border-gray-border px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-gray-border py-2.5 text-sm font-semibold text-dark-gray transition hover:bg-bubble-gray"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 rounded-full bg-brand-red py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPending || isResolvingCover ? "저장 중…" : "저장하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
