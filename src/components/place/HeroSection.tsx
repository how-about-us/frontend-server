"use client";

import { usePlacePhotoUrlsQuery } from "@/hooks/usePlacePhotoUrl";

export function HeroSkeleton() {
  return <div className="h-full animate-pulse bg-gray-200" />;
}

export function HeroImage({
  photoNames,
  fallbackImage,
  name,
}: {
  photoNames: string[];
  fallbackImage?: string;
  name: string;
}) {
  const firstPhotoName = photoNames[0] ? [photoNames[0]] : [];
  const { photoUrls } = usePlacePhotoUrlsQuery(firstPhotoName);
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
