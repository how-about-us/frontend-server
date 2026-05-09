"use client";

import { useQuery } from "@tanstack/react-query";

import { getPlacePhotoUrl } from "@/lib/api/places";
import { OgPlacePreviewCard } from "@/components/chat/messages/OgPlacePreviewCard";
import { useSelectedPlace } from "@/contexts/SelectedPlaceContext";
import { useMapCenterStore } from "@/stores/map-center-store";
import { useSessionStore } from "@/stores/session-store";
import { cn } from "@/lib/utils";
import { chatMessageChrome } from "@/components/chat/chat-message-chrome";
import { resolveChatMessageTypography } from "@/components/chat/chat-typography";
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
    myId != null && senderUserId != null && senderUserId === myId;

  const { data: imageUrl } = useQuery({
    queryKey: ["place-photo", place?.photoName],
    queryFn: () => getPlacePhotoUrl(place!.photoName),
    enabled: Boolean(place?.photoName),
    staleTime: 5 * 60_000,
  });

  if (!place) return null;
  const p = place;

  function handleClick() {
    setMapCenter({ lat: p.latitude, lng: p.longitude });
    setSelectedPlace({
      name: p.name,
      category: "",
      rating: p.rating || null,
      address: p.formattedAddress,
      googlePlaceId: p.googlePlaceId,
      location: { lat: p.latitude, lng: p.longitude },
      image: imageUrl,
    });
  }

  const cardButton = (
    <OgPlacePreviewCard
      name={p.name}
      formattedAddress={p.formattedAddress}
      photoName={p.photoName}
      rating={p.rating}
      isMinimized={isMinimized}
      onClick={handleClick}
    />
  );

  const timeRow =
    message.time != null ?
      <span className={typo.metaMuted}>{message.time}</span>
    : null;

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
          {message.avatar ?
            // eslint-disable-next-line @next/next/no-img-element -- 멤버 프로필 URL 가변
            <img
              src={message.avatar}
              alt={message.sender ?? ""}
              className="h-full w-full object-cover"
            />
          : null}
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
