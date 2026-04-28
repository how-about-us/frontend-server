export function HeroSkeleton() {
  return (
    <div className="flex h-full gap-0.5 overflow-hidden">
      <div className="w-[62%] animate-pulse bg-gray-200" />
      <div className="flex flex-1 flex-col gap-0.5">
        <div className="flex-1 animate-pulse bg-gray-200" />
        <div className="flex-1 animate-pulse bg-gray-200" />
      </div>
    </div>
  );
}

export function HeroGrid({
  photoUrls,
  fallbackImage,
  name,
}: {
  photoUrls: string[];
  fallbackImage?: string;
  name: string;
}) {
  const photos =
    photoUrls.length > 0 ? photoUrls : fallbackImage ? [fallbackImage] : [];

  if (photos.length === 0) {
    return <div className="h-full bg-light-gray" />;
  }

  if (photos.length === 1) {
    return (
      <div className="h-full overflow-hidden">
        <img
          src={photos[0]}
          alt={name}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  const grid = photos.length >= 3 ? photos : [...photos, ...photos].slice(0, 3);

  return (
    <div className="flex h-full gap-0.5 overflow-hidden">
      <div className="w-[62%] overflow-hidden">
        <img src={grid[0]} alt={name} className="h-full w-full object-cover" />
      </div>
      <div className="flex flex-1 flex-col gap-0.5">
        <div className="flex-1 overflow-hidden">
          <img src={grid[1]} alt={name} className="h-full w-full object-cover" />
        </div>
        <div className="relative flex-1 overflow-hidden">
          <img src={grid[2]} alt={name} className="h-full w-full object-cover" />
          {photos.length > 3 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45">
              <span className="text-xs font-semibold text-white">
                +{photos.length - 3}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
