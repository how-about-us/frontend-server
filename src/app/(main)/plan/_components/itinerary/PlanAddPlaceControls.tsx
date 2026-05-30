"use client";

import { Bookmark } from "lucide-react";

import { PlacesSearchInput } from "@/components/search/PlacesSearchInput";
import { cn } from "@/lib/utils";

type PlanAddPlaceControlsProps = {
  coords: { lat: number; lng: number } | null;
  disabled?: boolean;
  onPickPrediction: (prediction: google.maps.places.PlacePrediction) => void;
  onOpenBookmark: () => void;
  className?: string;
};

export function PlanAddPlaceControls({
  coords,
  disabled = false,
  onPickPrediction,
  onOpenBookmark,
  className,
}: PlanAddPlaceControlsProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="min-w-0 flex-1">
        <PlacesSearchInput
          coords={coords}
          pickOnly
          leadingIcon="pin"
          placeholder="장소 추가하기"
          disabled={disabled}
          onSearch={() => {}}
          onPickPrediction={onPickPrediction}
        />
      </div>
      <button
        type="button"
        aria-label="북마크에서 장소 추가"
        disabled={disabled}
        onClick={onOpenBookmark}
        className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-gray-border bg-white text-dark-gray shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Bookmark className="size-4" strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}
