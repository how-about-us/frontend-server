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
  onEditClick: () => void;
}) {
  return (
    <div className="shrink-0 border-b border-gray-border px-6 pb-5">
      <Link
        href={BOOKMARK_LIST_PATH}
        className="flex w-full items-center justify-center rounded-full border-2 border-brand-red bg-bubble-gray py-3 text-base font-semibold text-brand-red shadow-md transition-opacity hover:opacity-90 active:opacity-85"
      >
        목록으로 돌아가기
      </Link>
      <div className="mt-6 flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <FolderRibbonIcon color={folder.color} variant="header" />
          <div className="min-w-0">
            <p className="truncate text-[17px] font-bold text-neutral-900">
              {folder.title}
            </p>
            <p className="mt-0.5 text-sm text-dark-gray">
              {folder.placeCount ?? folder.places.length}개 장소
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onEditClick}
          className="shrink-0 rounded-lg p-2.5 text-neutral-700 transition-colors hover:bg-bubble-gray"
          aria-label="장소 목록 편집"
        >
          <SquarePen className="size-6" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
