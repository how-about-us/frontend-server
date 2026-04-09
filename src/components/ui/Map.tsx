"use client";

import { Map as GoogleMap, AdvancedMarker } from "@vis.gl/react-google-maps";
import { useState } from "react";
import { MOCK_SEARCH_RESULTS } from "@/mocks";

const CATEGORIES = [
  { label: "음식점", emoji: "🍴" },
  { label: "호텔", emoji: "🛏" },
  { label: "즐길 거리", emoji: "📷" },
  { label: "박물관", emoji: "🏛" },
  { label: "대중교통", emoji: "🚌" },
  { label: "약국", emoji: "💊" },
  { label: "ATM", emoji: "🏧" },
];

const HIKONE_CENTER = { lat: 35.276, lng: 136.258 };

const OFFSET_SEEDS = [
  [0.004, -0.003],
  [-0.005, 0.006],
  [0.007, 0.002],
  [-0.003, -0.007],
  [0.001, 0.008],
  [-0.006, 0.001],
  [0.008, -0.005],
  [-0.002, 0.004],
];

const MOCK_MARKERS = MOCK_SEARCH_RESULTS.map((r, i) => ({
  name: r.name,
  category: r.category,
  description: r.description,
  rating: r.rating,
  position: {
    lat: HIKONE_CENTER.lat + (OFFSET_SEEDS[i % OFFSET_SEEDS.length][0]),
    lng: HIKONE_CENTER.lng + (OFFSET_SEEDS[i % OFFSET_SEEDS.length][1]),
  },
  id: i,
}));

export default function Map() {
  const [selected, setSelected] = useState<(typeof MOCK_MARKERS)[number] | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

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

      {/* 카테고리 필터 */}
      <div className="pointer-events-none absolute left-0 right-0 top-[72px] flex justify-end px-4">
        <div className="pointer-events-auto flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.label;
            return (
              <button
                key={cat.label}
                onClick={() => setActiveCategory(active ? null : cat.label)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-md transition ${
                  active
                    ? "bg-blue-600 text-white"
                    : "bg-white text-black hover:bg-gray-50"
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
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
