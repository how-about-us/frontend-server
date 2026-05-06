"use client";

import { useQuery } from "@tanstack/react-query";
import { MapPin, Star } from "lucide-react";

import { getPlacePhotoUrl } from "@/lib/api/places";
import { useSelectedPlace } from "@/contexts/SelectedPlaceContext";
import { useMapCenterStore } from "@/stores/map-center-store";
import { useSessionStore } from "@/stores/session-store";
import type { ChatMessage } from "@/types/chat";

export function PlaceShareCard({ message }: { message: ChatMessage }) {
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
      className="group flex w-[260px] overflow-hidden rounded-xl border border-gray-border bg-white text-left shadow-sm transition hover:border-brand-green/40 hover:shadow-md"
    >
      <div className="h-[88px] w-[88px] shrink-0 overflow-hidden bg-light-gray">
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
            <MapPin className="h-6 w-6 text-gray-300" />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3 py-2">
        <div className="truncate text-sm font-semibold leading-5 text-brand-green">
          {place.name}
        </div>
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 fill-[#FDC700] text-[#FDC700]" />
          <span className="text-[11px] font-medium leading-relaxed text-[#364153]">
            {place.rating ? place.rating.toFixed(1) : "-"}
          </span>
        </div>
        {place.formattedAddress && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0 text-[#99A1AF]" />
            <span className="truncate text-[11px] leading-relaxed text-[#99A1AF]">
              {place.formattedAddress}
            </span>
          </div>
        )}
      </div>
    </button>
  );

  const timeRow =
    message.time != null ? (
      <span className="text-[10px] leading-relaxed text-dark-gray">
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
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-light-gray">
          {message.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element -- 멤버 프로필 URL 가변
            <img
              src={message.avatar}
              alt={message.sender ?? ""}
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
        <span className="max-w-[4rem] truncate text-center text-[10px] leading-relaxed text-dark-gray">
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
