/// <reference types="google.maps" />

"use client";

import type { ReactNode } from "react";

/** Places Autocomplete Data — `fetchAutocompleteSuggestions` 호출 간 디바운스(ms) */
export const AUTOCOMPLETE_SUGGEST_DEBOUNCE_MS = 250;

/**
 * 레거시 `types: ['(regions)']` 대체 — AutocompleteRequest.includedPrimaryTypes 최대 5개.
 * @see https://developers.google.com/maps/documentation/javascript/places-migration-autocomplete
 */
export const DESTINATION_INCLUDED_PRIMARY_TYPES: readonly string[] = [
  "locality",
  "administrative_area_level_1",
  "administrative_area_level_2",
  "country",
  "postal_code",
];

export function circleLocationBias(
  center: google.maps.LatLngLiteral,
  radiusMeters: number,
): google.maps.CircleLiteral {
  return { center, radius: radiusMeters };
}

/** FormattableText.matches 범위로 main 텍스트 하이라이트 조각 */
export function formattableToHighlightedNodes(
  ft: google.maps.places.FormattableText | null | undefined,
  matchClassName: string,
): ReactNode[] {
  if (!ft?.text) return [];
  const text = ft.text;
  const ranges = ft.matches ?? [];
  const parts: ReactNode[] = [];
  let cursor = 0;
  for (let i = 0; i < ranges.length; i += 1) {
    const r = ranges[i];
    const start = r.startOffset;
    const end = r.endOffset;
    if (start > cursor) {
      parts.push(
        <span key={`pre-${i}-${start}`}>{text.slice(cursor, start)}</span>,
      );
    }
    parts.push(
      <span key={`m-${i}-${start}`} className={matchClassName}>
        {text.slice(start, end)}
      </span>,
    );
    cursor = end;
  }
  if (cursor < text.length) {
    parts.push(<span key="tail">{text.slice(cursor)}</span>);
  }
  return parts;
}

export async function fetchPlacePredictionsForRequest(
  request: google.maps.places.AutocompleteRequest,
): Promise<google.maps.places.PlacePrediction[]> {
  const { suggestions } =
    await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
      request,
    );
  return suggestions
    .map((s) => s.placePrediction)
    .filter((p): p is google.maps.places.PlacePrediction => p != null);
}

/** 자동완성 선택/텍스트 검색 확정 후 다음 입력을 새 세션으로 */
export function newAutocompleteSessionToken(): google.maps.places.AutocompleteSessionToken {
  return new google.maps.places.AutocompleteSessionToken();
}

export function PlacePredictionInlineDescription({
  prediction,
  matchClassName,
  primaryTextClassName,
  secondaryTextClassName,
}: {
  prediction: google.maps.places.PlacePrediction;
  matchClassName: string;
  primaryTextClassName: string;
  secondaryTextClassName: string;
}) {
  const main = prediction.mainText ?? prediction.text;
  const mainParts = formattableToHighlightedNodes(main, matchClassName);
  const secondaryText = prediction.secondaryText?.text?.trim() ?? "";

  return (
    <>
      <span className={primaryTextClassName}>{mainParts}</span>
      {secondaryText ? (
        <span className={secondaryTextClassName}>{secondaryText}</span>
      ) : null}
    </>
  );
}
