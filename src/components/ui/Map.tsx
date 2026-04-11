"use client";

import { useState } from "react";
import { Map as GoogleMap, AdvancedMarker } from "@vis.gl/react-google-maps";
import { FilterDropdown } from "./FilterDropdown";
import {
  PRICE_OPTIONS,
  RATING_OPTIONS,
  OPEN_OPTIONS,
  type PriceValue,
  type RatingValue,
  type OpenValue,
} from "./map-filters";
import { HIKONE_CENTER, MOCK_MARKERS, type MapMarker } from "@/mocks/map";

export default function Map() {
  const [selected, setSelected] = useState<MapMarker | null>(null);
  const [price, setPrice] = useState<PriceValue>("all");
  const [rating, setRating] = useState<RatingValue>("all");
  const [openNow, setOpenNow] = useState<OpenValue>("all");

  return (
    <div className="relative h-full w-full">
      <GoogleMap
        defaultCenter={HIKONE_CENTER}
        defaultZoom={14}
        mapId="DEMO_MAP_ID"
        gestureHandling="greedy"
        disableDefaultUI={false}
        zoomControl
        streetViewControl={false}
        mapTypeControl={false}
        fullscreenControl={false}
        clickableIcons={false}
        onClick={() => setSelected(null)}
      >
        {MOCK_MARKERS.map((marker) => (
          <AdvancedMarker
            key={marker.id}
            position={marker.position}
            onClick={() => setSelected(marker)}
          >
            <div
              className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold shadow-md transition ${
                selected?.id === marker.id
                  ? "bg-brand-red text-white"
                  : "bg-white text-black"
              }`}
            >
              <span>{marker.name}</span>
            </div>
          </AdvancedMarker>
        ))}
      </GoogleMap>

      {/* 필터 */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 mt-4 flex px-4">
        <div className="pointer-events-auto flex gap-2">
          <FilterDropdown
            label="가격"
            options={PRICE_OPTIONS}
            value={price}
            onChange={setPrice}
          />
          <FilterDropdown
            label="평점"
            options={RATING_OPTIONS}
            value={rating}
            onChange={setRating}
          />
          <FilterDropdown
            label="영업시간"
            options={OPEN_OPTIONS}
            value={openNow}
            onChange={setOpenNow}
          />
        </div>
      </div>

      {/* 선택된 장소 카드 */}
      {selected && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="rounded-xl border border-gray-border bg-white p-3 shadow-lg">
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-sm font-semibold text-brand-green">
                {selected.name}
              </h3>
              <span className="text-[11px] text-dark-gray">
                {selected.category}
              </span>
            </div>
            <p className="mt-0.5 truncate text-[11px] text-dark-gray">
              {selected.description}
            </p>
            <div className="mt-1 text-[11px] text-dark-gray">
              ⭐ {selected.rating}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
