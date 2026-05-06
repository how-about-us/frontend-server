"use client";

import { useEffect, useRef, useState } from "react";
import {
  AdvancedMarker,
  Map as GoogleMap,
  useMap,
  useMapsLibrary,
  type MapMouseEvent,
} from "@vis.gl/react-google-maps";

import { useSelectedPlace } from "@/contexts/SelectedPlaceContext";
import { useMapCenterStore } from "@/stores/map-center-store";
import { useSessionStore } from "@/stores/session-store";
import { useRoomsList } from "@/hooks/useRooms";
import { MapPinIcon } from "@/components/icons";
import { MapDiscoverToolbar } from "./MapDiscoverToolbar";
import { MapDiscoverPlaces } from "./MapDiscoverPlaces";
import { PlanItineraryMapRoutes } from "./PlanItineraryMapRoutes";
import type { OpenValue, RatingValue } from "./map-filters";

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

// ─── 장소 선택 시 지도 이동 ───────────────────────────────────────────────────

function SelectedPlaceController() {
  const map = useMap();
  const { selectedPlace, skipMapRecenterRef } = useSelectedPlace();

  useEffect(() => {
    if (!map || !selectedPlace?.location) return;
    if (skipMapRecenterRef.current) {
      skipMapRecenterRef.current = false;
      return;
    }
    map.panTo(selectedPlace.location);
    map.setZoom(16);
  }, [map, selectedPlace?.location, skipMapRecenterRef]);

  return null;
}

// ─── 방 destination 기준 초기 중심 설정 ──────────────────────────────────────

function DestinationController({
  destination,
}: {
  destination: string | null;
}) {
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
  const setMapCenter = useMapCenterStore((s) => s.setMapCenter);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [rating, setRating] = useState<RatingValue>("all");
  const [openNow, setOpenNow] = useState<OpenValue>("all");

  const currentRoomId = useSessionStore((s) => s.currentRoomId);
  const { data: roomsData } = useRoomsList();
  const destination =
    roomsData?.rooms.find((r) => r.id === currentRoomId)?.destination ?? null;

  const handleMapClick = (ev: MapMouseEvent) => {
    const placeId = ev.detail.placeId?.trim() ?? "";
    if (placeId.length > 0) {
      ev.stop();
      const latLng = ev.detail.latLng;
      setSelectedPlace(
        {
          name: "장소",
          category: "",
          rating: null,
          googlePlaceId: placeId,
          ...(latLng ? { location: latLng } : {}),
        },
        { skipMapRecenter: true },
      );
      return;
    }
    setSelectedPlace(null);
  };

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
        clickableIcons={selectedCategoryId == null}
        onClick={handleMapClick}
        onCameraChanged={(ev) =>
          setMapCenter({ lat: ev.detail.center.lat, lng: ev.detail.center.lng })
        }
      >
        <SelectedPlaceController />
        <DestinationController destination={destination} />

        {/* 펼쳐진 일차 일정 순서 장소 간 경로(Place ID Directions) */}
        <PlanItineraryMapRoutes />

        <MapDiscoverPlaces
          selectedCategoryId={selectedCategoryId}
          rating={rating}
          openNow={openNow}
        />

        {/* 선택된 장소 마커(검색·지도 POI 등) */}
        {selectedPlace?.location && (
          <AdvancedMarker
            position={selectedPlace.location}
            onClick={(e) => e.stop()}
          >
            <span
              className={`block scale-110 drop-shadow-lg ${
                selectedPlace.fromBookmark
                  ? "text-brand-green"
                  : "text-brand-red"
              }`}
            >
              <MapPinIcon size={44} />
            </span>
          </AdvancedMarker>
        )}
      </GoogleMap>

      <MapDiscoverToolbar
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        rating={rating}
        openNow={openNow}
        setRating={setRating}
        setOpenNow={setOpenNow}
      />
    </div>
  );
}
