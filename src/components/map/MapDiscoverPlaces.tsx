"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AdvancedMarker,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";

import { MapPinIcon } from "@/components/icons";
import { useSelectedPlace } from "@/contexts/SelectedPlaceContext";
import { normalizeGooglePlaceResourceId } from "@/lib/maps/normalizeGooglePlaceResourceId";

import { MAP_PLACE_CATEGORIES } from "./map-place-categories";
import type { OpenValue, RatingValue } from "./map-filters";

const DEBOUNCE_MS = 420;

/** Places API(New) field mask — camelCase 프로퍼티명과 동일 */
const NEARBY_FIELDS: string[] = [
  "id",
  "displayName",
  "location",
  "rating",
  "regularOpeningHours",
  "primaryTypeDisplayName",
];

function matchesRatingFilter(
  filter: RatingValue,
  rating: number | null | undefined,
): boolean {
  if (filter === "all") return true;
  if (rating == null) return false;
  return rating >= Number(filter);
}

type DiscoverMarker = {
  id: string;
  position: google.maps.LatLngLiteral;
  title: string;
  place: google.maps.places.Place;
};

export type MapDiscoverPlacesProps = {
  selectedCategoryId: string | null;
  rating: RatingValue;
  openNow: OpenValue;
};

function DiscoverMarkerPin({
  marker: m,
  selectedNormalized,
  categoryLabel,
  setSelectedPlace,
}: {
  marker: DiscoverMarker;
  selectedNormalized: string | null;
  categoryLabel: string;
  setSelectedPlace: ReturnType<
    typeof useSelectedPlace
  >["setSelectedPlace"];
}) {
  const legacyId = normalizeGooglePlaceResourceId(m.id);
  if (selectedNormalized && legacyId === selectedNormalized) return null;

  return (
    <AdvancedMarker
      position={m.position}
      title={m.title}
      onClick={(e) => {
        e.stop();
        const p = m.place;
        const loc = p.location;
        if (!loc) return;
        setSelectedPlace(
          {
            name: p.displayName ?? "장소",
            category:
              p.primaryTypeDisplayName?.trim() || categoryLabel,
            rating: p.rating ?? null,
            googlePlaceId: legacyId,
            location: loc.toJSON(),
          },
          { skipMapRecenter: true },
        );
      }}
    >
      <span className="block scale-90 text-brand-red drop-shadow-md">
        <MapPinIcon size={36} />
      </span>
    </AdvancedMarker>
  );
}

export function MapDiscoverPlaces({
  selectedCategoryId,
  rating,
  openNow,
}: MapDiscoverPlacesProps) {
  const map = useMap();
  const placesLib = useMapsLibrary("places");
  const geometryLib = useMapsLibrary("geometry");
  const { selectedPlace, setSelectedPlace } = useSelectedPlace();

  const [markers, setMarkers] = useState<DiscoverMarker[]>([]);

  const searchSeqRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runDiscoverSearch = useCallback(async () => {
    const seq = ++searchSeqRef.current;

    if (!map || !placesLib || !selectedCategoryId) {
      if (seq === searchSeqRef.current) setMarkers([]);
      return;
    }

    const bounds = map.getBounds();
    if (!bounds) return;

    const cat = MAP_PLACE_CATEGORIES.find((c) => c.id === selectedCategoryId);
    if (!cat) {
      if (seq === searchSeqRef.current) setMarkers([]);
      return;
    }

    const Place = placesLib.Place;

    try {
      let places: google.maps.places.Place[];

      if (openNow === "open") {
        // Nearby Search에는 isOpenNow 없음 → Text Search로 서버 측 "현재 영업" 제한
        const textRequest: google.maps.places.SearchByTextRequest = {
          fields: NEARBY_FIELDS,
          textQuery: cat.searchQuery,
          includedType: cat.googlePlaceTypeHint,
          useStrictTypeFiltering: true,
          locationRestriction: bounds.toJSON(),
          isOpenNow: true,
          maxResultCount: 20,
          language: "ko",
        };
        if (rating !== "all") {
          textRequest.minRating = Number(rating);
        }
        const res = await Place.searchByText(textRequest);
        places = res.places;
      } else {
        if (!geometryLib) return;
        const center = bounds.getCenter();
        const ne = bounds.getNorthEast();
        const radius = geometryLib.spherical.computeDistanceBetween(center, ne);
        const request: google.maps.places.SearchNearbyRequest = {
          fields: NEARBY_FIELDS,
          includedPrimaryTypes: [cat.googlePlaceTypeHint],
          locationRestriction: {
            center: center.toJSON(),
            radius,
          },
          maxResultCount: 20,
          language: "ko",
        };
        const res = await Place.searchNearby(request);
        places = res.places;
      }

      if (seq !== searchSeqRef.current) return;

      const list = places.filter((p) => {
        const loc = p.location;
        if (!loc) return false;
        if (!bounds.contains(loc)) return false;
        if (!matchesRatingFilter(rating, p.rating)) return false;
        return true;
      });

      if (seq !== searchSeqRef.current) return;

      setMarkers(
        list.map((p) => ({
          id: p.id,
          position: p.location!.toJSON(),
          title: p.displayName ?? "",
          place: p,
        })),
      );
    } catch {
      if (seq === searchSeqRef.current) setMarkers([]);
    }
  }, [
    map,
    placesLib,
    geometryLib,
    selectedCategoryId,
    rating,
    openNow,
  ]);

  const scheduleSearch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      void runDiscoverSearch();
    }, DEBOUNCE_MS);
  }, [runDiscoverSearch]);

  useEffect(() => {
    if (!selectedCategoryId) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      searchSeqRef.current += 1;
      setMarkers([]);
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    if (!map || !placesLib) return;
    const idleListener = map.addListener("idle", scheduleSearch);
    return () => {
      idleListener.remove();
    };
  }, [map, placesLib, scheduleSearch]);

  /** 평점·영업 필터 변경 시 현재 뷰 기준으로 마커를 다시 조회 */
  useEffect(() => {
    scheduleSearch();
  }, [selectedCategoryId, rating, openNow, scheduleSearch]);

  const selectedNormalized = selectedPlace?.googlePlaceId
    ? normalizeGooglePlaceResourceId(selectedPlace.googlePlaceId)
    : null;

  const categoryLabel =
    MAP_PLACE_CATEGORIES.find((c) => c.id === selectedCategoryId)?.label ?? "";

  return (
    <>
      {markers.map((m) => (
        <DiscoverMarkerPin
          key={m.id}
          marker={m}
          selectedNormalized={selectedNormalized}
          categoryLabel={categoryLabel}
          setSelectedPlace={setSelectedPlace}
        />
      ))}
    </>
  );
}
