"use client";

import { useRef, useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { useOnClickOutside } from "@/lib/hooks/useOnClickOutside";
import { RoomListItem } from "@/lib/api/rooms";

type Props = {
  room: RoomListItem;
  onEdit: (room: RoomListItem) => void;
  onDelete: (room: RoomListItem) => void;
};

export function RoomCardMenu({ room, onEdit, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(menuRef, () => setOpen(false));

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 shadow backdrop-blur-sm transition hover:bg-white"
        aria-label="더보기"
      >
        <MoreHorizontal size={13} className="text-dark-gray" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-32 overflow-hidden rounded-xl border border-gray-border bg-white shadow-lg">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setOpen(false);
              onEdit(room);
            }}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-dark-gray transition hover:bg-bubble-gray"
          >
            <Pencil size={13} />
            수정하기
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setOpen(false);
              onDelete(room);
            }}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-brand-red transition hover:bg-bubble-gray"
          >
            <Trash2 size={13} />
            삭제하기
          </button>
        </div>
      )}
    </div>
  );
}
