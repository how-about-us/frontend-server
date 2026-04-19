"use client";

import { useState } from "react";
import { Map as GoogleMap, AdvancedMarker } from "@vis.gl/react-google-maps";

import type { SearchResultCardProps } from "@/components/place/SearchResultCard";
import { useSelectedPlace } from "@/contexts/SelectedPlaceContext";
import {
  type PriceValue,
  type RatingValue,
  type OpenValue,
} from "./map-filters";
import { HIKONE_CENTER, MOCK_MARKERS, type MapMarker } from "@/mocks/map";
import { MapPinIcon } from "@/components/icons";
import MapFilter from "./MapFilter";

function markerToPlaceProps(marker: MapMarker): SearchResultCardProps {
  const { id: _id, position: _position, ...place } = marker;
  return place;
}

function isSamePlace(
  a: SearchResultCardProps | null,
  marker: MapMarker,
): boolean {
  if (!a) return false;
  return a.name === marker.name && a.address === marker.address;
}

export default function Map() {
  const { selectedPlace, setSelectedPlace } = useSelectedPlace();
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
        onClick={() => setSelectedPlace(null)}
      >
        {MOCK_MARKERS.map((marker) => (
          <AdvancedMarker
            key={marker.id}
            position={marker.position}
            onClick={(e) => {
              e.stop();
              setSelectedPlace(markerToPlaceProps(marker));
            }}
          >
            <div
              className={`flex flex-col items-center justify-end transition ${
                isSamePlace(selectedPlace, marker)
                  ? "scale-110 drop-shadow-lg"
                  : "drop-shadow-md"
              }`}
              aria-label={marker.name}
            >
              <span className="text-brand-red">
                <MapPinIcon size={44} />
              </span>
            </div>
          </AdvancedMarker>
        ))}
      </GoogleMap>

      <MapFilter
        price={price}
        rating={rating}
        openNow={openNow}
        setPrice={setPrice}
        setRating={setRating}
        setOpenNow={setOpenNow}
      />
    </div>
  );
}
