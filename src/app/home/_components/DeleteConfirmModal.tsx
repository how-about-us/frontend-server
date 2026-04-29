"use client";

import { useEffect } from "react";
import { Trash2 } from "lucide-react";

import { RoomListItem } from "@/lib/api/rooms";
import { useDeleteRoom } from "@/hooks/useRooms";

type Props = {
  room: RoomListItem;
  onClose: () => void;
};

export function DeleteConfirmModal({ room, onClose }: Props) {
  const { mutate: deleteRoom, isPending } = useDeleteRoom();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  function handleDelete() {
    deleteRoom(room.id, { onSuccess: onClose });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-xl">
        <div className="px-6 pb-2 pt-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <Trash2 size={22} className="text-brand-red" />
          </div>
          <h2 className="text-base font-bold">여행을 삭제할까요?</h2>
          <p className="mt-1.5 text-sm text-dark-gray">
            <span className="font-semibold">{room.title}</span> 여행이 영구적으로
            삭제됩니다.
          </p>
        </div>
        <div className="flex gap-2 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 rounded-full border border-gray-border py-2.5 text-sm font-semibold text-dark-gray transition hover:bg-bubble-gray disabled:opacity-40"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="flex-1 rounded-full bg-brand-red py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
          >
            {isPending ? "삭제 중…" : "삭제하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
