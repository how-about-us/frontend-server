"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { SearchResultCardProps } from "@/components/SearchResultCard";

type SelectedPlaceContextType = {
  selectedPlace: SearchResultCardProps | null;
  setSelectedPlace: (place: SearchResultCardProps | null) => void;
};

const SelectedPlaceContext = createContext<SelectedPlaceContextType>({
  selectedPlace: null,
  setSelectedPlace: () => {},
});

export function SelectedPlaceProvider({ children }: { children: ReactNode }) {
  const [selectedPlace, setSelectedPlace] =
    useState<SearchResultCardProps | null>(null);

  return (
    <SelectedPlaceContext.Provider value={{ selectedPlace, setSelectedPlace }}>
      {children}
    </SelectedPlaceContext.Provider>
  );
}

export function useSelectedPlace() {
  return useContext(SelectedPlaceContext);
}
