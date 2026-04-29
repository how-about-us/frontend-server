"use client";

import { useEffect, useRef, useState } from "react";
import {
  AdvancedMarker,
  Map as GoogleMap,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";

import type { SearchResultCardProps } from "@/components/place/SearchResultCard";
import { useSelectedPlace } from "@/contexts/SelectedPlaceContext";
import { useMapCenter } from "@/contexts/MapCenterContext";
import { useSessionStore } from "@/stores/session-store";
import { useRoomsList } from "@/hooks/useRooms";
import { type OpenValue, type PriceValue, type RatingValue } from "./map-filters";
import { MapPinIcon } from "@/components/icons";
import MapFilter from "./MapFilter";

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

// ─── 장소 선택 시 지도 이동 ───────────────────────────────────────────────────

function SelectedPlaceController() {
  const map = useMap();
  const { selectedPlace } = useSelectedPlace();

  useEffect(() => {
    if (!map || !selectedPlace?.location) return;
    map.panTo(selectedPlace.location);
    map.setZoom(16);
  }, [map, selectedPlace?.location?.lat, selectedPlace?.location?.lng]);

  return null;
}

// ─── 방 destination 기준 초기 중심 설정 ──────────────────────────────────────

function DestinationController({ destination }: { destination: string | null }) {
  const map = useMap();
  const geocodingLib = useMapsLibrary("geocoding");
  const geocodedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!map || !geocodingLib || !destination) return;
    // 같은 destination을 중복 지오코딩하지 않음
    if (geocodedRef.current === destination) return;

    const geocoder = new geocodingLib.Geocoder();
    geocoder.geocode({ address: destination }, (results, status) => {
      if (status === "OK" && results?.[0]?.geometry?.location) {
        const loc = results[0].geometry.location;
        map.setCenter({ lat: loc.lat(), lng: loc.lng() });
        map.setZoom(12);
        geocodedRef.current = destination;
      }
    });
  }, [map, geocodingLib, destination]);

  return null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Map() {
  const { selectedPlace, setSelectedPlace } = useSelectedPlace();
  const { setMapCenter } = useMapCenter();
  const [price, setPrice] = useState<PriceValue>("all");
  const [rating, setRating] = useState<RatingValue>("all");
  const [openNow, setOpenNow] = useState<OpenValue>("all");

  const currentRoomId = useSessionStore((s) => s.currentRoomId);
  const { data: roomsData } = useRoomsList();
  const destination =
    roomsData?.rooms.find((r) => r.id === currentRoomId)?.destination ?? null;

  const searchMarker: SearchResultCardProps | null =
    selectedPlace?.location ? selectedPlace : null;

  return (
    <div className="relative h-full w-full">
      <GoogleMap
        defaultCenter={DEFAULT_CENTER}
        defaultZoom={13}
        mapId="DEMO_MAP_ID"
        gestureHandling="greedy"
        disableDefaultUI={false}
        zoomControl
        streetViewControl={false}
        mapTypeControl={false}
        fullscreenControl={false}
        clickableIcons={false}
        onClick={() => setSelectedPlace(null)}
        onCameraChanged={(ev) =>
          setMapCenter({ lat: ev.detail.center.lat, lng: ev.detail.center.lng })
        }
      >
        <SelectedPlaceController />
        <DestinationController destination={destination} />

        {/* 검색으로 선택된 장소 마커 */}
        {searchMarker?.location && (
          <AdvancedMarker
            position={searchMarker.location}
            onClick={(e) => e.stop()}
          >
            <div className="flex flex-col items-center drop-shadow-lg">
              <div className="mb-1 max-w-[120px] truncate rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-brand-green shadow-sm ring-1 ring-brand-green/20">
                {searchMarker.name}
              </div>
              <span className="scale-110 text-brand-green">
                <MapPinIcon size={44} />
              </span>
            </div>
          </AdvancedMarker>
        )}
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
