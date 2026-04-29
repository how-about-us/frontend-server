"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Calendar, MoreHorizontal, Pencil, Trash2, X } from "lucide-react";

import { useOnClickOutside } from "@/lib/hooks/useOnClickOutside";
import { AUTH_SESSION_COOKIE } from "@/lib/auth-session";
import { useSessionStore } from "@/stores/session-store";
import { getRoomGradient } from "@/stores/rooms-store";
import { useDeleteRoom, useRoomsList, useUpdateRoom } from "@/hooks/useRooms";
import { RoomListItem } from "@/lib/api/rooms";
import { DestinationSearchInput } from "@/components/search/DestinationSearchInput";

function formatDateRange(startDate: string, endDate: string): string {
  const fmt = (d: string) => {
    const date = new Date(d);
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };
  if (!startDate && !endDate) return "";
  if (startDate === endDate) return fmt(startDate);
  return `${fmt(startDate)} – ${fmt(endDate)}`;
}

// ─── Card menu (... dropdown) ────────────────────────────────────────────────

function RoomCardMenu({
  room,
  onEdit,
  onDelete,
}: {
  room: RoomListItem;
  onEdit: (room: RoomListItem) => void;
  onDelete: (room: RoomListItem) => void;
}) {
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

// ─── Edit modal ──────────────────────────────────────────────────────────────

function EditRoomModal({
  room,
  onClose,
}: {
  room: RoomListItem;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(room.title);
  const [destination, setDestination] = useState(room.destination);
  const [startDate, setStartDate] = useState(room.startDate ?? "");
  const [endDate, setEndDate] = useState(room.endDate ?? "");

  const { mutate: updateRoom, isPending, error } = useUpdateRoom();

  // close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const canSave = title.trim() && destination.trim() && !isPending;

  function handleSave() {
    if (!canSave) return;
    updateRoom(
      {
        roomId: room.id,
        data: {
          title: title.trim(),
          destination: destination.trim(),
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      },
      { onSuccess: onClose },
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
        {/* Header */}
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

        {/* Body */}
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

        {/* Footer */}
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
            {isPending ? "저장 중…" : "저장하기"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete confirm modal ────────────────────────────────────────────────────

function DeleteConfirmModal({
  room,
  onClose,
}: {
  room: RoomListItem;
  onClose: () => void;
}) {
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

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(profileRef, () => setProfileOpen(false));

  const user = useSessionStore((s) => s.user);
  const clearUser = useSessionStore((s) => s.clearUser);
  const setCurrentRoomId = useSessionStore((s) => s.setCurrentRoomId);

  const { data, isLoading, isError, refetch } = useRoomsList();
  const rooms = data?.rooms ?? [];

  const [editingRoom, setEditingRoom] = useState<RoomListItem | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<RoomListItem | null>(null);

  const handleLogout = () => {
    document.cookie = `${AUTH_SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    clearUser();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 border-b border-gray-border bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <Image
            src="/icons/logo.svg"
            alt="로고"
            width={140}
            height={20}
            className="h-5 w-auto"
          />
          <div className="flex items-center gap-3">
            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-red text-xs font-semibold text-white transition hover:opacity-90"
                aria-label="프로필"
                aria-expanded={profileOpen}
              >
                {user?.avatarInitial ?? "?"}
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-xl border border-gray-border bg-white shadow-lg">
                  {user && (
                    <div className="border-b border-gray-border px-4 py-2.5">
                      <p className="truncate text-xs font-semibold text-black">
                        {user.name}
                      </p>
                      <p className="truncate text-[11px] text-dark-gray">
                        {user.email}
                      </p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 text-left text-sm text-dark-gray transition hover:bg-bubble-gray"
                  >
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">나의 여행 계획</h1>
          <Link
            href="/home/new"
            className="flex items-center gap-1.5 rounded-full bg-brand-red px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            + 새 여행 계획
          </Link>
        </div>

        <div className="mt-6">
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-border border-t-brand-red" />
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-border py-20 text-center">
              <p className="text-sm font-medium text-dark-gray">
                여행 목록을 불러오지 못했어요
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-3 rounded-full bg-brand-red px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                다시 시도
              </button>
            </div>
          )}

          {!isLoading && !isError && rooms.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-border py-20 text-center">
              <p className="text-sm font-medium text-dark-gray">
                아직 여행이 없어요
              </p>
              <p className="mt-1 text-xs text-light-gray">
                새 여행 계획을 만들어 시작해보세요
              </p>
              <Link
                href="/home/new"
                className="mt-4 rounded-full bg-brand-red px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                + 새 여행 계획
              </Link>
            </div>
          )}

          {!isLoading && !isError && rooms.length > 0 && (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
              {rooms.map((room) => {
                const gradient = getRoomGradient(room.id);
                const dateStr = formatDateRange(room.startDate, room.endDate);
                return (
                  <div key={room.id} className="group">
                    <div className="relative">
                      <div
                        className={`aspect-[4/3] w-full overflow-hidden rounded-xl bg-gradient-to-br ${gradient}`}
                      />
                      <div className="absolute right-2 top-2">
                        <RoomCardMenu
                          room={room}
                          onEdit={setEditingRoom}
                          onDelete={setDeletingRoom}
                        />
                      </div>
                    </div>
                    <Link
                      href={`/plan/${room.id}`}
                      className="mt-2 block"
                      onClick={() => setCurrentRoomId(room.id)}
                    >
                      <p className="text-sm font-semibold">{room.title}</p>
                      <p className="mt-0.5 text-xs text-dark-gray">
                        {room.destination}
                      </p>
                      {dateStr && (
                        <p className="mt-0.5 text-xs text-light-gray">
                          {dateStr}
                        </p>
                      )}
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {editingRoom && (
        <EditRoomModal
          room={editingRoom}
          onClose={() => setEditingRoom(null)}
        />
      )}

      {deletingRoom && (
        <DeleteConfirmModal
          room={deletingRoom}
          onClose={() => setDeletingRoom(null)}
        />
      )}
    </div>
  );
}
