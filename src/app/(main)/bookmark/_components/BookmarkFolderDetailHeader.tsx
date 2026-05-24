"use client";

import { SquarePen } from "lucide-react";
import Link from "next/link";
import type { BookmarkFolder } from "@/types/bookmark";
import { BOOKMARK_LIST_PATH } from "../routes";
import { FolderRibbonIcon } from "./FolderRibbonIcon";

export function BookmarkFolderDetailHeader({
  folder,
  onEditClick,
}: {
  folder: BookmarkFolder;
  onEditClick?: () => void;
}) {
  return (
    <div className="shrink-0 border-b border-gray-border pb-5">
      <div className="flex justify-end">
        <Link
          href={BOOKMARK_LIST_PATH}
          className="inline-flex items-center justify-center rounded-full border-2 border-brand-red bg-bubble-gray px-4 py-2 text-sm font-semibold text-brand-red shadow-sm transition-opacity hover:opacity-95 active:opacity-90"
        >
          목록으로 돌아가기
        </Link>
      </div>
      <div className="mt-6 flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <FolderRibbonIcon color={folder.color} variant="header" />
          <div className="min-w-0">
            <p className="truncate text-[17px] font-bold text-neutral-900">
              {folder.title}
            </p>
            <p className="mt-0.5 text-sm text-dark-gray">
              {folder.placeCount ?? 0}개 장소
            </p>
          </div>
        </div>
        {onEditClick ? (
          <button
            type="button"
            onClick={onEditClick}
            className="shrink-0 cursor-pointer rounded-lg p-2.5 text-neutral-700 transition-colors hover:bg-bubble-gray"
            aria-label="장소 목록 편집"
          >
            <SquarePen className="size-6" strokeWidth={2} />
          </button>
        ) : (
          <span className="w-11 shrink-0" aria-hidden />
        )}
      </div>
    </div>
  );
}
