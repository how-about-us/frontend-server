"use client";

import { Search } from "lucide-react";

type SearchHereFloatingButtonProps = {
  visible: boolean;
  onPress: () => void;
};

export function SearchHereFloatingButton({
  visible,
  onPress,
}: SearchHereFloatingButtonProps) {
  if (!visible) return null;

  return (
    <div className="pointer-events-none absolute bottom-6 left-1/2 z-[17] -translate-x-1/2">
      <button
        type="button"
        onClick={onPress}
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-gray-border bg-white px-4 py-2.5 text-sm font-semibold text-dark-gray shadow-md ring-2 ring-black/5 transition hover:bg-gray-50"
      >
        <Search
          className="h-4 w-4 shrink-0 text-brand-green"
          strokeWidth={2.2}
        />
        현 위치 검색
      </button>
    </div>
  );
}
