"use client";

import { useEffect, useRef, useState } from "react";
import { Bookmark } from "lucide-react";
import {
  AdvancedMarker,
  Map as GoogleMap,
  useMap,
  useMapsLibrary,
  type MapMouseEvent,
} from "@vis.gl/react-google-maps";

import { useSelectedPlace } from "@/contexts/SelectedPlaceContext";
import {
  readDestinationLatLngFromSession,
  viewportSearchRadiusMetersFromBounds,
  writeDestinationLatLngToSession,
} from "@/lib/maps";
import {
  DESTINATION_MAP_ZOOM,
  useTripMapBootstrap,
} from "@/hooks/useTripMapBootstrap";
import { useMapCenterStore } from "@/stores/map-center-store";
import { useSessionStore } from "@/stores/session-store";
import { useSearchMapPinsStore } from "@/stores/search-map-pins-store";
import { useRoomsList } from "@/hooks/useRooms";
import { MapPinIcon } from "@/components/icons";
import { MapPinWithPlaceName } from "@/components/map/MapPinWithPlaceName";
import { MapBookmarkPins } from "./MapBookmarkPins";
import { MapSearchHereButton } from "./MapSearchHereButton";
import { MapDiscoverToolbar } from "./MapDiscoverToolbar";
import { MapDiscoverPlaces } from "./MapDiscoverPlaces";
import { PlanItineraryMapRoutes } from "./PlanItineraryMapRoutes";
import type { OpenValue, RatingValue } from "./map-filters";

// ─── 장소 선택 시 지도 이동 ───────────────────────────────────────────────────

function SelectedPlaceController() {
  const map = useMap();
  const { selectedPlace, placeSelectionCameraRef } = useSelectedPlace();

  useEffect(() => {
    if (!map || !selectedPlace?.location) return;
    const mode = placeSelectionCameraRef.current;
    placeSelectionCameraRef.current = "full";

    if (mode === "none") return;
    map.panTo(selectedPlace.location);
    if (mode === "full") {
      map.setZoom(16);
    }
  }, [map, selectedPlace?.location, placeSelectionCameraRef]);

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

function MapSearchResultPins() {
  const pins = useSearchMapPinsStore((s) => s.pins);
  const { selectedPlace, setSelectedPlace } = useSelectedPlace();
  const selectedPlaceId = selectedPlace?.googlePlaceId?.trim() ?? "";

  return (
    <>
      {pins
        .filter((p) => p.googlePlaceId !== selectedPlaceId)
        .map((pin) => (
          <AdvancedMarker
            key={pin.googlePlaceId}
            position={{ lat: pin.lat, lng: pin.lng }}
            onClick={(e) => {
              e.stop();
              setSelectedPlace({
                name: pin.name,
                category: "",
                rating: null,
                googlePlaceId: pin.googlePlaceId,
                location: { lat: pin.lat, lng: pin.lng },
              }, { preserveMapZoom: true });
            }}
          >
            <MapPinWithPlaceName name={pin.name} />
          </AdvancedMarker>
        ))}
    </>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Map() {
  const { selectedPlace, setSelectedPlace } = useSelectedPlace();
  const setMapCamera = useMapCenterStore((s) => s.setMapCamera);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [rating, setRating] = useState<RatingValue>("all");
  const [openNow, setOpenNow] = useState<OpenValue>("all");
  const [showBookmarkPins, setShowBookmarkPins] = useState(true);

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
    <div className="relative h-full min-h-0 w-full min-w-0 overflow-hidden">
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
          onCameraChanged={(ev) => {
            const { center, zoom, bounds } = ev.detail;
            const radiusMeters = viewportSearchRadiusMetersFromBounds(
              center,
              bounds,
            );
            setMapCamera({
              mapCenter: { lat: center.lat, lng: center.lng },
              zoom,
              radiusMeters,
            });
          }}
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

          <MapBookmarkPins roomId={currentRoomId} enabled={showBookmarkPins} />

          <MapSearchResultPins />

          {selectedPlace?.location && (
            <AdvancedMarker
              position={selectedPlace.location}
              onClick={(e) => e.stop()}
            >
              <span
                className={`block scale-110 drop-shadow-lg ${
                  selectedPlace.fromBookmark
                    ? selectedPlace.bookmarkCategoryColor?.trim()
                      ? ""
                      : "text-brand-green"
                    : "text-brand-red"
                }`}
                style={
                  selectedPlace.fromBookmark &&
                  selectedPlace.bookmarkCategoryColor?.trim()
                    ? { color: selectedPlace.bookmarkCategoryColor.trim() }
                    : undefined
                }
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

      {!bootstrap.ready ? null : (
        <>
          <MapSearchHereButton />
          <div className="pointer-events-none absolute right-4 top-4 z-[16]">
            <button
              type="button"
              onClick={() => setShowBookmarkPins((v) => !v)}
              aria-pressed={showBookmarkPins}
              aria-label={
                showBookmarkPins
                  ? "보관함 장소 표시 끄기"
                  : "보관함 장소 표시 켜기"
              }
              title="보관함 장소 표시"
              className={`pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full shadow-md ring-2 ring-black/5 transition ${
                showBookmarkPins
                  ? "bg-brand-red text-white"
                  : "bg-white text-dark-gray hover:bg-gray-50"
              }`}
            >
              <Bookmark className="h-5 w-5" strokeWidth={2.2} aria-hidden />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
