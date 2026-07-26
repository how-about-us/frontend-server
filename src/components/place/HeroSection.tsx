"use client";

import { usePlacePhotoUrlsQuery } from "@/hooks/usePlacePhotoUrl";
import { useInViewport } from "@/hooks/useInViewport";

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
  const { ref, isInViewport } = useInViewport<HTMLDivElement>({
    enabled: firstPhotoName.length > 0,
  });
  const { photoUrls } = usePlacePhotoUrlsQuery(firstPhotoName, {
    enabled: isInViewport,
  });
  const photoUrl = photoUrls[0] ?? fallbackImage ?? null;

  if (!photoUrl) {
    return <div ref={ref} className="h-full bg-light-gray" />;
  }

  return (
    <div ref={ref} className="h-full overflow-hidden">
      <img
        src={photoUrl}
        alt={name}
        className="h-full w-full object-cover"
      />
    </div>
  );
}
