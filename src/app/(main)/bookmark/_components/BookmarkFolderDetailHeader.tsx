"use client";

import { SquarePen } from "lucide-react";
import Link from "next/link";

import {
  pageToolbarButtonCompactGapClass,
  pageToolbarButtonCompactPaddingClass,
  pageToolbarButtonCompactTextClass,
} from "@/components/layout/page-toolbar-button";
import { cn } from "@/lib/utils";
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
      <div className="flex h-7 min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <FolderRibbonIcon
            color={folder.color}
            variant="header"
            className="size-7"
          />
          <h1 className="min-w-0 truncate text-lg font-bold text-black">
            {folder.title}
          </h1>
          <span className="shrink-0 text-xs text-dark-gray">
            {folder.placeCount ?? 0}개 장소
          </span>
        </div>
        {onEditClick ? (
          <button
            type="button"
            onClick={onEditClick}
            className="shrink-0 cursor-pointer rounded-lg p-1 text-neutral-700 transition-colors hover:bg-bubble-gray"
            aria-label="장소 목록 편집"
          >
            <SquarePen className="size-5" strokeWidth={2} />
          </button>
        ) : null}
      </div>

      <div className="mt-2.5 flex justify-end">
        <Link
          href={BOOKMARK_LIST_PATH}
          className={cn(
            "flex w-fit items-center justify-center rounded-full bg-brand-red text-white shadow-sm transition-opacity hover:opacity-95 active:opacity-90",
            pageToolbarButtonCompactGapClass,
            pageToolbarButtonCompactTextClass,
            pageToolbarButtonCompactPaddingClass,
          )}
        >
          목록으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
