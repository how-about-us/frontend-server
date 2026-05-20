import { useQuery } from "@tanstack/react-query";

import { getPlacePhotoUrl } from "@/lib/api/places";
import {
  placePhotoUrlQueryDefaults,
  placePhotoUrlQueryKey,
} from "@/lib/place-photo-query";

export function usePlacePhotoUrlQuery(photoName: string | null | undefined) {
  const name = typeof photoName === "string" ? photoName.trim() : "";
  return useQuery({
    queryKey: placePhotoUrlQueryKey(name),
    queryFn: () => getPlacePhotoUrl(name),
    enabled: name.length > 0,
    ...placePhotoUrlQueryDefaults,
  });
}
