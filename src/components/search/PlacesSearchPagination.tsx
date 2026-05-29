"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

type PlacesSearchPaginationProps = {
  hasPrevious: boolean;
  hasNext: boolean;
  pageLabel: string;
  onPrevious: () => void;
  onNext: () => void;
  disabled?: boolean;
};

export function PlacesSearchPagination({
  hasPrevious,
  hasNext,
  pageLabel,
  onPrevious,
  onNext,
  disabled = false,
}: PlacesSearchPaginationProps) {
  return (
    <nav
      aria-label="검색 결과 페이지"
      className="grid w-full min-w-0 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-gray-border bg-white px-6 py-3"
    >
      <div className="flex min-w-0 justify-start">
        {hasPrevious ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onPrevious}
            className={cn(
              "inline-flex cursor-pointer items-center gap-0.5 text-sm font-medium text-dark-gray transition hover:text-brand-green disabled:cursor-not-allowed disabled:opacity-50",
            )}
            aria-label="이전 페이지"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
            <span>이전</span>
          </button>
        ) : null}
      </div>

      <span className="shrink-0 px-2 text-center text-sm font-medium text-brand-green">
        {pageLabel}
      </span>

      <div className="flex min-w-0 justify-end">
        {hasNext ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onNext}
            className={cn(
              "inline-flex cursor-pointer items-center gap-0.5 text-sm font-medium text-dark-gray transition hover:text-brand-green disabled:cursor-not-allowed disabled:opacity-50",
            )}
            aria-label="다음 페이지"
          >
            <span>다음</span>
            <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
          </button>
        ) : null}
      </div>
    </nav>
  );
}
