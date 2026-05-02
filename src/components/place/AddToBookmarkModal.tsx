"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HttpError } from "@/lib/api/rooms";
import type { BookmarkCategory } from "@/lib/api/rooms";
import { useBookmarkCategories, useCreateRoomBookmark } from "@/hooks/useRooms";
import { useSessionStore } from "@/stores/session-store";

type Props = {
  googlePlaceId: string;
  onClose: () => void;
  onAdded?: () => void;
};

export function AddToBookmarkModal({
  googlePlaceId,
  onClose,
  onAdded,
}: Props) {
  const roomId = useSessionStore((s) => s.currentRoomId);
  const {
    data: categories,
    isPending: categoriesLoading,
    isError: categoriesError,
    error: categoriesErr,
    refetch,
  } = useBookmarkCategories(roomId);
  const { mutate: addBookmark, isPending: isAdding } = useCreateRoomBookmark();
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const pickCategory = (c: BookmarkCategory) => {
    if (!roomId || isAdding) return;
    setSubmitError(null);
    addBookmark(
      { roomId, googlePlaceId, categoryId: c.categoryId },
      {
        onSuccess: () => {
          onAdded?.();
          onClose();
        },
        onError: (e) => {
          if (e instanceof HttpError && e.status === 409) {
            toast.error(
              e.message || "이미 북마크에 추가된 장소입니다",
            );
            return;
          }
          setSubmitError(
            e instanceof Error ? e.message : "보관함에 추가하지 못했습니다.",
          );
        },
      },
    );
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[min(80vh,520px)] w-full max-w-sm flex-col rounded-2xl border border-gray-border bg-white shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-bookmark-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-gray-border px-5 py-4">
          <h2
            id="add-bookmark-modal-title"
            className="text-lg font-semibold text-neutral-900"
          >
            보관함에 추가
          </h2>
          <p className="mt-1 text-sm text-dark-gray">
            담을 북마크 카테고리를 선택하세요.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {!roomId && (
            <p className="text-center text-sm text-dark-gray">
              방을 선택한 뒤 다시 시도해 주세요.
            </p>
          )}

          {roomId && categoriesLoading && (
            <p className="text-center text-sm text-dark-gray">불러오는 중…</p>
          )}

          {roomId && categoriesError && (
            <div className="space-y-2 text-center">
              <p className="text-sm text-brand-red">
                {categoriesErr instanceof Error
                  ? categoriesErr.message
                  : "카테고리를 불러오지 못했습니다."}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="text-sm font-medium text-neutral-900 underline"
              >
                다시 시도
              </button>
            </div>
          )}

          {roomId && categories && categories.length === 0 && (
            <p className="text-center text-sm text-dark-gray">
              북마크 카테고리가 없습니다. 보관함 탭에서 먼저 만들어 주세요.
            </p>
          )}

          {roomId && categories && categories.length > 0 && (
            <ul className="space-y-2">
              {categories.map((c) => (
                <li key={c.categoryId}>
                  <button
                    type="button"
                    disabled={isAdding}
                    onClick={() => pickCategory(c)}
                    className="flex w-full items-center gap-3 rounded-xl border border-gray-border px-3 py-3 text-left transition-colors hover:bg-bubble-gray disabled:opacity-60"
                  >
                    <span
                      className="size-4 shrink-0 rounded-full border border-black/10 shadow-sm"
                      style={{ backgroundColor: c.colorCode }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-900">
                      {c.name}
                    </span>
                    {c.placeCount > 0 && (
                      <span className="shrink-0 text-xs text-dark-gray">
                        {c.placeCount}곳
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {submitError && (
            <p className="mt-3 text-center text-sm text-brand-red">
              {submitError}
            </p>
          )}
        </div>

        <div className="shrink-0 border-t border-gray-border px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-gray-border py-2.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-bubble-gray"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
