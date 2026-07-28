"use client";

import { usePlacePhotoUrlsQuery } from "@/hooks/usePlacePhotoUrl";

export function HeroSkeleton() {
  return <div className="h-full animate-pulse bg-gray-200" />;
}

export function HeroImage({
  googlePlaceId,
  fallbackImage,
  name,
}: {
  googlePlaceId?: string;
  fallbackImage?: string;
  name: string;
}) {
  const { photoUrls } = usePlacePhotoUrlsQuery(googlePlaceId ? [googlePlaceId] : []);
  const photoUrl = photoUrls[0] ?? fallbackImage ?? null;

  if (!photoUrl) {
    return <div className="h-full bg-light-gray" />;
  }

  return (
    <div className="h-full overflow-hidden">
      <img
        src={photoUrl}
        alt={name}
        className="h-full w-full object-cover"
      />
    </div>
  );
}
