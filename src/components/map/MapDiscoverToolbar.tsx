"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import MapFilter from "./MapFilter";
import { MapCategoryChips } from "./MapCategoryChips";
import type { OpenValue, RatingValue } from "./map-filters";
import { mapToolbarPanelMotion } from "./map-toolbar-motion";

type MapDiscoverToolbarProps = {
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  rating: RatingValue;
  openNow: OpenValue;
  setRating: (v: RatingValue) => void;
  setOpenNow: (v: OpenValue) => void;
};

export function MapDiscoverToolbar({
  selectedCategoryId,
  onSelectCategory,
  rating,
  openNow,
  setRating,
  setOpenNow,
}: MapDiscoverToolbarProps) {
  return (
    <div className="pointer-events-none absolute left-0 right-0 top-0 z-[15] mt-4 px-4">
      <AnimatePresence mode="wait" initial={false}>
        {selectedCategoryId == null ? (
          <motion.div key="chips" className="w-full" {...mapToolbarPanelMotion}>
            <MapCategoryChips
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={onSelectCategory}
            />
          </motion.div>
        ) : (
          <motion.div
            key="filter"
            className="pointer-events-auto -mx-1 flex w-full flex-wrap items-center gap-2 pb-0.5"
            {...mapToolbarPanelMotion}
          >
            <MapFilter
              rating={rating}
              openNow={openNow}
              setRating={setRating}
              setOpenNow={setOpenNow}
            />
            <button
              type="button"
              onClick={() => onSelectCategory(null)}
              aria-label="카테고리 닫기"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-dark-gray shadow-md transition hover:bg-gray-50"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
