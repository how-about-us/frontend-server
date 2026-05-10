"use client";

import { Check, Plus, Star } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { messageForBookmarkCategorySaveError } from "@/lib/api/errors";
import { AddBookmarkModal } from "@/app/(main)/bookmark/_components/AddBookmarkModal";
import { pickUniqueUntitledBookmarkCategoryName } from "@/lib/bookmark-untitled-category-name";
import {
  useBookmarkCategories,
  useCreateBookmarkCategory,
  useCreateRoomBookmarksInCategories,
} from "@/hooks/useRooms";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/session-store";

type Props = {
  googlePlaceId: string;
  onClose: () => void;
  onAdded?: () => void;
};

export function AddToBookmarkModal({ googlePlaceId, onClose, onAdded }: Props) {
  const roomId = useSessionStore((s) => s.currentRoomId);
  const {
    data: categories,
    isPending: categoriesLoading,
    isError: categoriesError,
    error: categoriesErr,
    refetch,
  } = useBookmarkCategories(roomId);
  const { mutate: addBookmarksBulk, isPending: isAddingBookmarks } =
    useCreateRoomBookmarksInCategories();
  const { mutate: createCategory, isPending: isCreatingCategory } =
    useCreateBookmarkCategory();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [createFolderModalKey, setCreateFolderModalKey] = useState(0);
  const [selectedIds, setSelectedIds] = useState(() => new Set<number>());

  const toggleCategory = useCallback((categoryId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
    setSubmitError(null);
  }, []);

  useEffect(() => {
    if (createFolderModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, createFolderModalOpen]);

  const openCreateFolderModal = () => {
    setCreateFolderModalKey((k) => k + 1);
    setCreateFolderModalOpen(true);
  };

  const selectedAsArray = useMemo(() => Array.from(selectedIds), [selectedIds]);

  const notifyResult = ({
    added,
    skippedDuplicate,
    firstHardError,
  }: {
    added: number;
    skippedDuplicate: number;
    firstHardError: Error | null;
  }) => {
    if (firstHardError) {
      toast.error(firstHardError.message);
      if (added > 0) {
        toast.message(`추가한 리스트는 ${added}개예요`);
      }
      return;
    }
    if (added > 0 && skippedDuplicate === 0) {
      toast.success(
        added === 1 ? "보관함에 추가했어요" : `${added}개 리스트에 추가했어요`,
      );
    } else if (added > 0 && skippedDuplicate > 0) {
      toast.success(`${added}개 리스트에 추가했어요`, {
        description: `${skippedDuplicate}개 리스트에는 이미 이 장소가 있어요`,
      });
    } else if (added === 0 && skippedDuplicate > 0) {
      toast.message("모든 선택 리스트에 이미 추가되어 있어요");
    }
  };

  const handleConfirmAdd = () => {
    if (!roomId || isAddingBookmarks) return;
    if (selectedAsArray.length === 0) {
      setSubmitError("리스트를 하나 이상 선택해 주세요.");
      return;
    }
    setSubmitError(null);
    addBookmarksBulk(
      {
        roomId,
        googlePlaceId,
        categoryIds: selectedAsArray,
      },
      {
        onSuccess: (result) => {
          notifyResult(result);
          if (result.added > 0) {
            onAdded?.();
          }
          if (!result.firstHardError) {
            onClose();
          }
        },
      },
    );
  };

  const handleCreateFolderSave = ({
    title,
    color,
  }: {
    title: string;
    color: string;
  }) => {
    if (!roomId || isCreatingCategory || isAddingBookmarks) return;
    const resolvedName = title.trim()
      ? title.trim()
      : pickUniqueUntitledBookmarkCategoryName(
          (categories ?? []).map((c) => c.name),
        );
    createCategory(
      { roomId, name: resolvedName, colorCode: color },
      {
        onSuccess: (created) => {
          setCreateFolderModalOpen(false);
          setSubmitError(null);
          setSelectedIds((prev) => new Set(prev).add(created.categoryId));
        },
        onError: (e) => {
          toast.error(
            messageForBookmarkCategorySaveError(
              e,
              "카테고리를 만들지 못했습니다.",
            ),
          );
        },
      },
    );
  };

  if (!roomId) {
    return null;
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[60] flex flex-col justify-end bg-black/40 md:justify-center md:px-4"
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-bookmark-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
        className={cn(
          "flex max-h-[min(85vh,560px)] w-full flex-col overflow-hidden",
          "border-t border-gray-border bg-white shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.12)] md:rounded-2xl md:border md:shadow-lg",
          "rounded-t-[1.35rem]",
          "mx-auto md:max-w-sm",
          "pb-[max(env(safe-area-inset-bottom,0px),12px)]",
        )}
      >
        <div
          aria-hidden
          className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-black/15 md:hidden"
        />

        <div className="shrink-0 px-5 pb-2 pt-3">
          <h2
            id="add-bookmark-modal-title"
            className="text-lg font-semibold text-neutral-900"
          >
            보관함에 추가
          </h2>
          <p className="mt-1 text-sm text-dark-gray">
            담을 리스트를 선택한 뒤 추가를 눌러 주세요.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-color:rgba(0,0,0,0.15)_transparent] [scrollbar-gutter:stable]">
          <button
            type="button"
            disabled={isCreatingCategory || isAddingBookmarks}
            onClick={openCreateFolderModal}
            className={cn(
              "flex w-full items-center gap-2.5 border-b border-gray-border px-5 py-3.5 text-left text-sm font-medium text-neutral-900 transition-colors hover:bg-bubble-gray",
              "disabled:opacity-55",
            )}
          >
            <Plus className="size-5 shrink-0 stroke-[2.25]" aria-hidden />새
            리스트 만들기
          </button>

          {categoriesLoading && (
            <p className="px-5 py-6 text-center text-sm text-dark-gray">
              불러오는 중…
            </p>
          )}

          {categoriesError && (
            <div className="space-y-2 px-5 py-6 text-center">
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

          {categories && categories.length === 0 && !categoriesLoading && (
            <div className="space-y-3 px-5 py-6 text-center">
              <p className="text-sm text-dark-gray">
                북마크 리스트가 없습니다. 새로 만들어 주세요.
              </p>
              <button
                type="button"
                onClick={openCreateFolderModal}
                disabled={isCreatingCategory || isAddingBookmarks}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-border bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:bg-bubble-gray disabled:opacity-60"
              >
                <Plus className="size-4" strokeWidth={2.2} aria-hidden />새
                리스트 만들기
              </button>
            </div>
          )}

          {categories && categories.length > 0 && (
            <ul role="list">
              {categories.map((c, index) => {
                const sel = selectedIds.has(c.categoryId);
                return (
                  <li
                    key={c.categoryId}
                    className={cn(index > 0 && "border-t border-gray-border")}
                  >
                    <button
                      type="button"
                      disabled={isAddingBookmarks}
                      aria-pressed={sel}
                      aria-label={`${c.name} 리스트에서 ${sel ? "선택 해제" : "선택"}`}
                      onClick={() => toggleCategory(c.categoryId)}
                      className={cn(
                        "flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-black/[0.02]",
                        "disabled:opacity-60",
                      )}
                    >
                      <span
                        className="flex size-10 shrink-0 items-center justify-center rounded-full text-white shadow-inner"
                        style={{ backgroundColor: c.colorCode }}
                        aria-hidden
                      >
                        <Star
                          className="size-[1.125rem] fill-current text-white/95"
                          strokeWidth={1.25}
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-neutral-900">
                          {c.name}
                          <span className="ml-1.5 inline font-normal text-dark-gray tabular-nums">
                            {c.placeCount}
                          </span>
                        </span>
                      </div>
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                          sel
                            ? "border-brand-red bg-brand-red text-white shadow-sm"
                            : "border-gray-300 bg-white text-transparent",
                        )}
                      >
                        <Check className="size-[1.125rem]" strokeWidth={3} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {submitError && (
            <p className="border-t border-gray-border px-5 py-3 text-center text-sm text-brand-red">
              {submitError}
            </p>
          )}
        </div>

        <div className="flex shrink-0 gap-2 border-t border-gray-border px-5 pt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isAddingBookmarks}
            className="flex-1 rounded-xl border border-gray-border py-2.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-bubble-gray disabled:opacity-60"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={handleConfirmAdd}
            disabled={
              isAddingBookmarks ||
              selectedIds.size === 0 ||
              (categories?.length === 0 && !categoriesLoading)
            }
            className="flex-1 rounded-xl bg-brand-red py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95 disabled:opacity-55"
          >
            {isAddingBookmarks ? "추가 중…" : "추가"}
          </button>
        </div>
      </div>

      {createFolderModalOpen && (
        <AddBookmarkModal
          key={createFolderModalKey}
          mode="create"
          initialFolder={null}
          overlayZClass="z-[65]"
          busy={isCreatingCategory || isAddingBookmarks}
          untitledNameHint={pickUniqueUntitledBookmarkCategoryName(
            (categories ?? []).map((c) => c.name),
          )}
          onClose={() => setCreateFolderModalOpen(false)}
          onSave={handleCreateFolderSave}
        />
      )}
    </div>
  );
}
