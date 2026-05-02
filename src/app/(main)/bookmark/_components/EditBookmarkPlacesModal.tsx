"use client";

import { Check, ChevronLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { BookmarkFolder, BookmarkedPlace } from "@/types/bookmark";

function CircleCheckbox({
  checked,
  onToggle,
  labelledBy,
}: {
  checked: boolean;
  onToggle: () => void;
  labelledBy?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      onClick={onToggle}
      className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
        checked
          ? "border-brand-red bg-brand-red text-white"
          : "border-gray-300 bg-white text-transparent"
      }`}
    >
      <Check className="size-3.5 stroke-[3]" aria-hidden />
    </button>
  );
}

function PlaceEditRow({
  place,
  checked,
  onToggle,
}: {
  place: BookmarkedPlace;
  checked: boolean;
  onToggle: () => void;
}) {
  const labelId = `place-label-${place.id}`;
  const address = place.address ?? place.reviewSummary ?? "";

  return (
    <div className="flex gap-3 border-b border-gray-border px-4 py-3">
      <div className="pt-0.5">
        <CircleCheckbox
          checked={checked}
          onToggle={onToggle}
          labelledBy={labelId}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p id={labelId} className="text-[15px] font-bold text-neutral-900">
            {place.name}
          </p>
          <span className="text-xs text-dark-gray">{place.category}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-dark-gray">
          {address}
        </p>
        {place.image && (
          <div className="mt-2.5">
            <div className="h-16 w-16 overflow-hidden rounded-lg bg-light-gray">
              <img
                src={place.image}
                alt=""
                className="size-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function EditBookmarkPlacesModal({
  folder,
  folders,
  onClose,
  onRemovePlaces,
  onMovePlaces,
}: {
  folder: BookmarkFolder;
  folders: BookmarkFolder[];
  onClose: () => void;
  onRemovePlaces: (placeIds: string[]) => void;
  onMovePlaces: (targetFolderId: string, placeIds: string[]) => void;
}) {
  const { places } = folder;
  const [phase, setPhase] = useState<"list" | "movePick">("list");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [moveTargetId, setMoveTargetId] = useState<string | null>(null);

  const otherFolders = useMemo(
    () => folders.filter((f) => f.id !== folder.id),
    [folders, folder.id],
  );

  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set(
        [...prev].filter((id) => places.some((p) => p.id === id)),
      );
      return next.size === prev.size && [...next].every((id) => prev.has(id))
        ? prev
        : next;
    });
  }, [places]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (phase === "movePick") {
          setPhase("list");
          setMoveTargetId(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, phase]);

  const allSelected =
    places.length > 0 && selectedIds.size === places.length;
  const someSelected = selectedIds.size > 0;

  const toggleAll = useCallback(() => {
    if (places.length === 0) return;
    setSelectedIds((prev) =>
      prev.size === places.length ? new Set() : new Set(places.map((p) => p.id)),
    );
  }, [places]);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectedIdList = useMemo(() => [...selectedIds], [selectedIds]);

  const handleDelete = useCallback(() => {
    if (selectedIdList.length === 0) return;
    onRemovePlaces(selectedIdList);
    setSelectedIds(new Set());
  }, [onRemovePlaces, selectedIdList]);

  const openMovePick = useCallback(() => {
    if (selectedIdList.length === 0) return;
    if (otherFolders.length === 0) return;
    setMoveTargetId(otherFolders[0]?.id ?? null);
    setPhase("movePick");
  }, [otherFolders, selectedIdList.length]);

  const commitMove = useCallback(() => {
    if (!moveTargetId || selectedIdList.length === 0) return;
    onMovePlaces(moveTargetId, selectedIdList);
    setSelectedIds(new Set());
    setPhase("list");
    setMoveTargetId(null);
  }, [moveTargetId, onMovePlaces, selectedIdList]);

  const selectAllRowId = "bookmark-edit-select-all-label";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget) onClose();
      }}
    >
      <div
        className="flex h-[min(92vh,720px)] w-full max-w-md flex-col rounded-t-2xl border border-gray-border bg-white shadow-xl sm:max-h-[85vh] sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-places-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {phase === "list" ? (
          <>
            <div className="shrink-0 border-b border-gray-border px-5 py-4">
              <h2
                id="edit-places-modal-title"
                className="text-lg font-semibold text-neutral-900"
              >
                장소 목록 편집
              </h2>
            </div>

            <button
              type="button"
              role="checkbox"
              aria-checked={allSelected}
              aria-labelledby={selectAllRowId}
              onClick={toggleAll}
              disabled={places.length === 0}
              className="flex w-full shrink-0 items-center gap-3 border-b border-gray-border px-4 py-3.5 text-left transition-colors hover:bg-bubble-gray disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  allSelected
                    ? "border-brand-red bg-brand-red text-white"
                    : "border-gray-300 bg-white text-transparent"
                }`}
              >
                <Check className="size-3.5 stroke-[3]" aria-hidden />
              </span>
              <span
                id={selectAllRowId}
                className="text-[15px] font-medium text-neutral-900"
              >
                전체 선택
              </span>
            </button>

            <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-color:rgba(0,0,0,0.2)_transparent]">
              {places.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-dark-gray">
                  이 북마크에 담긴 장소가 없습니다.
                </p>
              ) : (
                places.map((place) => (
                  <PlaceEditRow
                    key={place.id}
                    place={place}
                    checked={selectedIds.has(place.id)}
                    onToggle={() => toggleOne(place.id)}
                  />
                ))
              )}
            </div>

            <div className="shrink-0 border-t border-gray-border bg-white px-4 py-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!someSelected || otherFolders.length === 0}
                  onClick={openMovePick}
                  className="flex-1 rounded-xl bg-neutral-400 py-3.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  이동
                </button>
                <button
                  type="button"
                  disabled={!someSelected}
                  onClick={handleDelete}
                  className="flex-1 rounded-xl bg-neutral-400 py-3.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  삭제
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex shrink-0 items-center gap-2 border-b border-gray-border px-3 py-3">
              <button
                type="button"
                onClick={() => {
                  setPhase("list");
                  setMoveTargetId(null);
                }}
                className="rounded-lg p-2 text-neutral-700 transition-colors hover:bg-bubble-gray"
                aria-label="뒤로"
              >
                <ChevronLeft className="size-6" />
              </button>
              <h2 className="text-lg font-semibold text-neutral-900">
                이동할 북마크
              </h2>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {otherFolders.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-dark-gray">
                  이동할 수 있는 다른 북마크가 없습니다.
                </p>
              ) : (
                <ul className="divide-y divide-gray-border">
                  {otherFolders.map((f) => {
                    const active = moveTargetId === f.id;
                    return (
                      <li key={f.id}>
                        <button
                          type="button"
                          onClick={() => setMoveTargetId(f.id)}
                          className={`flex w-full items-center gap-3 px-4 py-4 text-left transition-colors ${
                            active ? "bg-red-50" : "hover:bg-bubble-gray"
                          }`}
                        >
                          <span
                            className={`flex size-5 shrink-0 rounded-full border-2 ${
                              active
                                ? "border-brand-red bg-brand-red"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            {active ? (
                              <Check className="m-auto size-3 text-white stroke-[3]" />
                            ) : null}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-neutral-900">
                            {f.title}
                          </span>
                          <span className="shrink-0 text-sm text-dark-gray">
                            {f.places.length}개
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="shrink-0 border-t border-gray-border px-4 py-4">
              <button
                type="button"
                disabled={!moveTargetId}
                onClick={commitMove}
                className="w-full rounded-xl bg-brand-red py-3.5 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                이동하기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
