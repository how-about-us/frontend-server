"use client";

import { useQuery } from "@tanstack/react-query";
import { MapPin, Star } from "lucide-react";

import { getPlacePhotoUrl } from "@/lib/api/places";
import { useSelectedPlace } from "@/contexts/SelectedPlaceContext";
import { useMapCenterStore } from "@/stores/map-center-store";
import { useSessionStore } from "@/stores/session-store";
import { cn } from "@/lib/utils";
import { chatMessageChrome } from "@/components/chat/lib/chatMessageChrome";
import { resolveChatMessageTypography } from "@/components/chat/lib/chatTypography";
import type { ChatMessage } from "@/types/chat";

export function PlaceShareCard({
  message,
  isMinimized = false,
}: {
  message: ChatMessage;
  isMinimized?: boolean;
}) {
  const typo = resolveChatMessageTypography(isMinimized);
  const place = message.place;
  const myId = useSessionStore((s) => s.user?.id);
  const { setSelectedPlace } = useSelectedPlace();
  const setMapCenter = useMapCenterStore((s) => s.setMapCenter);

  const senderUserId = message.senderUserId;
  const isMine =
    myId != null &&
    senderUserId != null &&
    senderUserId === myId;

  const { data: imageUrl } = useQuery({
    queryKey: ["place-photo", place?.photoName],
    queryFn: () => getPlacePhotoUrl(place!.photoName),
    enabled: Boolean(place?.photoName),
    staleTime: 5 * 60_000,
  });

  if (!place) return null;

  function handleClick() {
    if (!place) return;
    setMapCenter({ lat: place.latitude, lng: place.longitude });
    setSelectedPlace({
      name: place.name,
      category: "",
      rating: place.rating || null,
      address: place.formattedAddress,
      googlePlaceId: place.googlePlaceId,
      location: { lat: place.latitude, lng: place.longitude },
      image: imageUrl,
    });
  }

  const cardButton = (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "group flex overflow-hidden rounded-xl border border-gray-border bg-white text-left shadow-sm transition hover:border-brand-green/40 hover:shadow-md",
        isMinimized ? "w-full max-w-[228px]" : "w-[260px]",
      )}
    >
      <div
        className={cn(
          "shrink-0 overflow-hidden bg-light-gray",
          isMinimized ? "h-[72px] w-[72px]" : "h-[88px] w-[88px]",
        )}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- 동적 장소 사진 URL (원격 패턴 비고정)
          <img
            src={imageUrl}
            alt={place.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <MapPin
              className={cn(
                "text-gray-300",
                isMinimized ? "h-5 w-5" : "h-6 w-6",
              )}
            />
          </div>
        )}
      </div>
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col justify-center",
          isMinimized ? "gap-0.5 px-2 py-1.5" : "gap-1 px-3 py-2",
        )}
      >
        <div className={cn("truncate", typo.placeTitle)}>
          {place.name}
        </div>
        <div className="flex items-center gap-1">
          <Star
            className={cn(
              "fill-[#FDC700] text-[#FDC700]",
              isMinimized ? "h-2.5 w-2.5" : "h-3 w-3",
            )}
          />
          <span className={typo.placeRating}>
            {place.rating ? place.rating.toFixed(1) : "-"}
          </span>
        </div>
        {place.formattedAddress && (
          <div className="flex items-center gap-1">
            <MapPin
              className={cn(
                "shrink-0 text-[#99A1AF]",
                isMinimized ? "h-2.5 w-2.5" : "h-3 w-3",
              )}
            />
            <span className={cn("truncate", typo.placeAddress)}>
              {place.formattedAddress}
            </span>
          </div>
        )}
      </div>
    </button>
  );

  const timeRow =
    message.time != null ? (
      <span className={typo.metaMuted}>
        {message.time}
      </span>
    ) : null;

  if (isMine) {
    return (
      <div className="flex flex-col items-end gap-1">
        {cardButton}
        {timeRow}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <div className="flex flex-col items-center gap-1">
        <div className={cn(chatMessageChrome.avatarSm, "bg-light-gray")}>
          {message.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element -- 멤버 프로필 URL 가변
            <img
              src={message.avatar}
              alt={message.sender ?? ""}
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
        <span
          className={cn(
            "max-w-[4rem] truncate text-center",
            typo.metaMuted,
          )}
        >
          {message.sender}
        </span>
      </div>
      <div className="flex min-w-0 flex-col items-start gap-1">
        {cardButton}
        {timeRow}
      </div>
    </div>
  );
}
