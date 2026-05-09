"use client";

import { useQuery } from "@tanstack/react-query";

import { OgPlacePreviewCard } from "@/components/chat/messages/OgPlacePreviewCard";
import { AiHighlightedText } from "@/components/chat/chat-ai-highlighted-text";
import {
  chatAiBubbleBlockSubtitleClass,
  chatAiBubbleBlockTitleClass,
} from "@/components/chat/chat-typography";
import { useSelectedPlace } from "@/contexts/SelectedPlaceContext";
import { aiRecommendedPlaceEnrichmentQueryKey } from "@/lib/query-keys";
import { resolvePlaceCardEnrichmentFromPlaceId } from "@/lib/places/placeCardEnrichment";
import { useMapCenterStore } from "@/stores/map-center-store";
import type {
  AiPlaceRecommendationHeading,
  AiRecommendedPlace,
} from "@/types/chat";
import { cn } from "@/lib/utils";

function AiRecommendedPlaceRow({
  place,
  isMinimized,
}: {
  place: AiRecommendedPlace;
  isMinimized: boolean;
}) {
  const { setSelectedPlace } = useSelectedPlace();
  const setMapCenter = useMapCenterStore((s) => s.setMapCenter);

  const fromMeta =
    typeof place.photoName === "string" ? place.photoName.trim() : "";
  const needsDetail =
    fromMeta.length === 0 ||
    place.rating === undefined ||
    place.userRatingCount === undefined;
  const { data: enriched } = useQuery({
    queryKey: aiRecommendedPlaceEnrichmentQueryKey(place.placeId),
    queryFn: () => resolvePlaceCardEnrichmentFromPlaceId(place.placeId),
    enabled: needsDetail && place.placeId.trim().length > 0,
    staleTime: 5 * 60_000,
  });
  const photoName =
    fromMeta || enriched?.photoName?.trim() || "";
  const displayRating =
    place.rating !== undefined ? place.rating : enriched?.rating ?? null;
  const displayReviewCount =
    place.userRatingCount !== undefined ?
      place.userRatingCount
    : enriched?.userRatingCount ?? null;

  function handleClick() {
    setMapCenter({ lat: place.lat, lng: place.lng });
    setSelectedPlace({
      name: place.name,
      category: place.primaryType ?? "",
      rating: displayRating ?? null,
      userRatingCount: displayReviewCount,
      address: place.address,
      googlePlaceId: place.placeId,
      location: { lat: place.lat, lng: place.lng },
      image: undefined,
    });
  }

  return (
    <div className="flex max-w-full flex-col gap-1">
      <OgPlacePreviewCard
        name={place.name}
        formattedAddress={place.address}
        photoName={photoName}
        rating={displayRating}
        userRatingCount={displayReviewCount}
        isMinimized={isMinimized}
        onClick={handleClick}
      />
      {place.reason ?
        <p
          className={cn(
            "max-w-[260px] text-[10px] leading-snug text-white/75",
            isMinimized && "max-w-[228px]",
          )}
        >
          <AiHighlightedText text={place.reason} />
        </p>
      : null}
    </div>
  );
}

export function AiRecommendedPlacesList({
  places,
  heading,
  isMinimized,
  className,
}: {
  places: AiRecommendedPlace[];
  heading?: AiPlaceRecommendationHeading;
  isMinimized: boolean;
  className?: string;
}) {
  if (!places.length) return null;

  const titleCls = chatAiBubbleBlockTitleClass(isMinimized);
  const subtitleCls = chatAiBubbleBlockSubtitleClass(isMinimized);

  return (
    <div
      className={cn(
        "mt-2 flex flex-col gap-2 border-t border-white/20 pt-2",
        className,
      )}
    >
      {heading?.title ?
        <div className={titleCls}>
          <AiHighlightedText text={heading.title} />
        </div>
      : null}
      {heading?.subtitle ?
        <div className={subtitleCls}>
          <AiHighlightedText text={heading.subtitle} />
        </div>
      : null}
      <div className="flex flex-col gap-4">
        {places.map((p) => (
          <AiRecommendedPlaceRow
            key={`${p.placeId}-${p.name}`}
            place={p}
            isMinimized={isMinimized}
          />
        ))}
      </div>
    </div>
  );
}
