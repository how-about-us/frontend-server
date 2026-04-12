"use client";

import { useEffect, useState } from "react";
import type { BookmarkFolder } from "@/mocks";

const COLOR_PRESETS = [
  "#EAB308",
  "#14B8A6",
  "#F12D33",
  "#3B82F6",
  "#A855F7",
  "#EC4899",
  "#22C55E",
  "#F97316",
] as const;

type Mode = "create" | "edit";

function initialTitle(mode: Mode, initialFolder: BookmarkFolder | null) {
  if (mode === "edit" && initialFolder) return initialFolder.title;
  return "";
}

function initialColor(mode: Mode, initialFolder: BookmarkFolder | null) {
  if (mode === "edit" && initialFolder) return initialFolder.color;
  return COLOR_PRESETS[0];
}

export function AddBookmarkModal({
  mode,
  initialFolder,
  onClose,
  onSave,
}: {
  mode: Mode;
  initialFolder: BookmarkFolder | null;
  onClose: () => void;
  onSave: (payload: { title: string; color: string }) => void;
}) {
  const [title, setTitle] = useState(() => initialTitle(mode, initialFolder));
  const [color, setColor] = useState(() => initialColor(mode, initialFolder));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    onSave({
      title: trimmed || "제목 없는 북마크",
      color,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-gray-border bg-white p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bookmark-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2
          id="bookmark-modal-title"
          className="text-lg font-semibold text-neutral-900"
        >
          {mode === "edit" ? "북마크 편집" : "새 북마크"}
        </h2>
        <p className="mt-1 text-sm text-dark-gray">
          이름과 리본 색상을 선택하세요.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div>
            <label
              htmlFor="bookmark-title"
              className="mb-1.5 block text-sm font-medium text-neutral-900"
            >
              제목
            </label>
            <input
              id="bookmark-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목 없는 북마크"
              className="w-full rounded-xl border border-gray-border px-3 py-2.5 text-sm outline-none ring-brand-red/30 focus:border-brand-red focus:ring-2"
            />
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-neutral-900">
              색상
            </span>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  title={hex}
                  onClick={() => setColor(hex)}
                  className="size-9 rounded-full border-2 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/50"
                  style={{
                    backgroundColor: hex,
                    borderColor: color === hex ? "#171717" : "transparent",
                    boxShadow:
                      color === hex ? "0 0 0 2px white, 0 0 0 4px #171717" : "",
                  }}
                  aria-pressed={color === hex}
                />
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <label
                htmlFor="bookmark-color-custom"
                className="text-sm text-dark-gray"
              >
                직접 선택
              </label>
              <input
                id="bookmark-color-custom"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded-md border border-gray-border bg-white p-0.5"
              />
              <span className="font-mono text-xs text-dark-gray">{color}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-border py-2.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-bubble-gray"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-brand-red py-2.5 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-95"
            >
              {mode === "edit" ? "저장" : "추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
