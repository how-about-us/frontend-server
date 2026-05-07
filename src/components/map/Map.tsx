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
import {
  DESTINATION_MAP_ZOOM,
  useTripMapBootstrap,
} from "@/hooks/useTripMapBootstrap";
import {
  readDestinationLatLngFromSession,
  writeDestinationLatLngToSession,
} from "@/lib/maps/destinationCenterSessionCache";
import { useSessionStore } from "@/stores/session-store";
import { useRoomsList } from "@/hooks/useRooms";
import { MapPinIcon } from "@/components/icons";
import { MapDiscoverToolbar } from "./MapDiscoverToolbar";
import { MapDiscoverPlaces } from "./MapDiscoverPlaces";
import { PlanItineraryMapRoutes } from "./PlanItineraryMapRoutes";
import type { OpenValue, RatingValue } from "./map-filters";

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

// ─── 방 destination 변경 시 지도 동기화(설정 수정 등)·캐시 갱신 ───────────────

function DestinationPanController({
  roomId,
  destination,
}: {
  roomId: string | null;
  destination: string | null;
}) {
  const map = useMap();
  const geocodingLib = useMapsLibrary("geocoding");
  const appliedDestRef = useRef<string | null>(null);
  const lastRoomRef = useRef<string | null>(null);

  useEffect(() => {
    const rid = typeof roomId === "string" ? roomId.trim() : "";
    if (lastRoomRef.current !== rid) {
      lastRoomRef.current = rid.length > 0 ? rid : null;
      appliedDestRef.current = null;
    }
  }, [roomId]);

  useEffect(() => {
    const rid = typeof roomId === "string" ? roomId.trim() : "";
    const dest = typeof destination === "string" ? destination.trim() : "";
    if (!map || !dest.length || !geocodingLib) return;

    if (appliedDestRef.current === dest) return;

    const fromCache =
      rid.length > 0 ? readDestinationLatLngFromSession(rid, dest) : null;
    if (fromCache) {
      map.setCenter(fromCache);
      map.setZoom(DESTINATION_MAP_ZOOM);
      appliedDestRef.current = dest;
      return;
    }

    const geocoder = new geocodingLib.Geocoder();
    geocoder.geocode({ address: dest }, (results, status) => {
      if (status === "OK" && results?.[0]?.geometry?.location) {
        const loc = results[0].geometry.location;
        const c = { lat: loc.lat(), lng: loc.lng() };
        map.setCenter(c);
        map.setZoom(DESTINATION_MAP_ZOOM);
        appliedDestRef.current = dest;
        if (rid.length) writeDestinationLatLngToSession(rid, dest, c);
      }
    });
  }, [map, geocodingLib, roomId, destination]);

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
  const { data: roomsData, isFetched: roomsFetched } = useRoomsList();
  const destination =
    roomsData?.rooms.find((r) => r.id === currentRoomId)?.destination ?? null;

  const geocodingLib = useMapsLibrary("geocoding");
  const bootstrap = useTripMapBootstrap(
    currentRoomId,
    destination,
    roomsFetched,
    geocodingLib,
  );

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
      {!bootstrap.ready ? (
        <div
          className="h-full w-full bg-[#e8e6e3]"
          aria-busy="true"
          aria-label="지도 위치 불러오는 중"
        />
      ) : (
        <GoogleMap
          defaultCenter={bootstrap.center}
          defaultZoom={bootstrap.zoom}
          mapId="DEMO_MAP_ID"
          gestureHandling="greedy"
          disableDefaultUI
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
          <DestinationPanController
            roomId={currentRoomId}
            destination={destination}
          />

          <PlanItineraryMapRoutes />

          <MapDiscoverPlaces
            selectedCategoryId={selectedCategoryId}
            rating={rating}
            openNow={openNow}
          />

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
      )}

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
