"use client";

import { useEffect, useRef } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";

interface PlaceAutocompleteProps {
  onPlaceSelect?: (place: google.maps.places.Place) => void;
}

export function PlaceAutocomplete({ onPlaceSelect }: PlaceAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const places = useMapsLibrary("places");
  const onPlaceSelectRef = useRef(onPlaceSelect);
  onPlaceSelectRef.current = onPlaceSelect;

  useEffect(() => {
    if (!places || !containerRef.current) return;

    const PlaceAutocompleteElement = (places as never as Record<string, unknown>)
      .PlaceAutocompleteElement as {
      new (opts?: Record<string, unknown>): HTMLElement & {
        placeholder: string;
      };
    };

    const el = new PlaceAutocompleteElement({
      componentRestrictions: { country: "jp" },
    });
    el.placeholder = "장소를 검색하세요";

    el.addEventListener("gmp-select", async (e: Event) => {
      const { placePrediction } = e as unknown as {
        placePrediction: google.maps.places.PlacePrediction;
      };
      const place = placePrediction.toPlace();
      await place.fetchFields({
        fields: ["displayName", "formattedAddress", "location"],
      });
      onPlaceSelectRef.current?.(place);
    });

    containerRef.current.replaceChildren(el);

    return () => {
      containerRef.current?.replaceChildren();
    };
  }, [places]);

  return <div ref={containerRef} className="w-full [&>*]:w-full" />;
}
