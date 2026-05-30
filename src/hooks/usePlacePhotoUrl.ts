import { useQuery } from "@tanstack/react-query";

import { requestPlacePhotoUrl } from "@/lib/api/places";
import {
  placePhotoUrlQueryDefaults,
  placePhotoUrlQueryKey,
} from "@/lib/place-photo-query";

export function usePlacePhotoUrlQuery(photoName: string | null | undefined) {
  const name = typeof photoName === "string" ? photoName.trim() : "";
  return useQuery({
    queryKey: placePhotoUrlQueryKey(name),
    // queryFn 안에서 fetchPlacePhotoUrl(동일 queryKey fetchQuery)을 쓰면 대기 데드락
    queryFn: () => requestPlacePhotoUrl(name),
    enabled: name.length > 0,
    ...placePhotoUrlQueryDefaults,
  });
}
