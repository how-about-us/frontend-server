"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
import type { SearchResultCardProps } from "@/types/place";

export type SetSelectedPlaceOptions = {
  /** true면 카메라 패닝·줌(SelectedPlaceController)을 건너뜀 — 예: 지도 POI 직접 클릭 */
  skipMapRecenter?: boolean;
};

type SelectedPlaceContextType = {
  selectedPlace: SearchResultCardProps | null;
  setSelectedPlace: (
    place: SearchResultCardProps | null,
    options?: SetSelectedPlaceOptions,
  ) => void;
  skipMapRecenterRef: MutableRefObject<boolean>;
};

const SelectedPlaceContext = createContext<SelectedPlaceContextType>({
  selectedPlace: null,
  setSelectedPlace: () => {},
  skipMapRecenterRef: { current: false },
});

export function SelectedPlaceProvider({ children }: { children: ReactNode }) {
  const [selectedPlace, setSelectedPlaceState] =
    useState<SearchResultCardProps | null>(null);
  const skipMapRecenterRef = useRef(false);

  const setSelectedPlace = useCallback(
    (place: SearchResultCardProps | null, options?: SetSelectedPlaceOptions) => {
      if (place === null) {
        skipMapRecenterRef.current = false;
        setSelectedPlaceState(null);
        return;
      }
      skipMapRecenterRef.current = options?.skipMapRecenter === true;
      setSelectedPlaceState(place);
    },
    [],
  );

  return (
    <SelectedPlaceContext.Provider
      value={{ selectedPlace, setSelectedPlace, skipMapRecenterRef }}
    >
      {children}
    </SelectedPlaceContext.Provider>
  );
}

export function useSelectedPlace() {
  return useContext(SelectedPlaceContext);
}
