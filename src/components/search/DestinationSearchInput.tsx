"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin, X } from "lucide-react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";

import { useDebouncedPlacePredictions } from "@/hooks/useDebouncedPlacePredictions";
import {
  DESTINATION_INCLUDED_PRIMARY_TYPES,
  PlacePredictionInlineDescription,
} from "@/lib/placesAutocompleteSuggest";

type Prediction = google.maps.places.PlacePrediction;

type Props = {
  value: string;
  onChange: (value: string) => void;
  /** Autocomplete에서 항목을 고르면 `placeId` 포함. 타이핑·지우기 시 `null`. */
  onResolvedPlace?: (
    place: { description: string; placeId: string } | null,
  ) => void;
  placeholder?: string;
  autoFocus?: boolean;
};

/**
 * Google Places Autocomplete Data API 기반 목적지 검색.
 * `includedPrimaryTypes`로 지역·행정구역·국가 등(레거시 `(regions)`에 대응).
 */
export function DestinationSearchInput({
  value,
  onChange,
  onResolvedPlace,
  placeholder = "예: 도쿄, 파리, 제주도",
  autoFocus = false,
}: Props) {
  const placesLib = useMapsLibrary("places");

  const buildRequest = useCallback(
    (
      input: string,
      sessionToken: google.maps.places.AutocompleteSessionToken,
    ): google.maps.places.AutocompleteRequest => ({
      input,
      language: "ko",
      includedPrimaryTypes: [...DESTINATION_INCLUDED_PRIMARY_TYPES],
      sessionToken,
    }),
    [],
  );

  const {
    predictions,
    isOpen,
    setIsOpen,
    activeIndex,
    setActiveIndex,
    scheduleFetch,
    invalidateSession,
    clearSuggestionUi,
  } = useDebouncedPlacePredictions({
    placesLibReady: !!placesLib,
    minInputLength: 1,
    buildRequest,
  });

  const [inputValue, setInputValue] = useState(value);
  const [committed, setCommitted] = useState(!!value);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // sync external reset (e.g. clear button from parent)
  useEffect(() => {
    if (!value) {
      queueMicrotask(() => {
        setInputValue("");
        setCommitted(false);
        invalidateSession();
        clearSuggestionUi();
      });
    }
  }, [value, invalidateSession, clearSuggestionUi]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        if (!committed) setInputValue(value);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [committed, setIsOpen, value]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setInputValue(v);
    setCommitted(false);
    onChange("");
    onResolvedPlace?.(null);
    scheduleFetch(v);
  }

  function handleSelect(prediction: Prediction) {
    const label = prediction.text.text;
    setInputValue(label);
    onChange(label);
    setCommitted(true);
    onResolvedPlace?.({ description: label, placeId: prediction.placeId });
    invalidateSession();
    clearSuggestionUi();
    setActiveIndex(-1);
  }

  function handleClear() {
    invalidateSession();
    clearSuggestionUi();
    setInputValue("");
    onChange("");
    setCommitted(false);
    onResolvedPlace?.(null);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || predictions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, predictions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && predictions[activeIndex]) {
        handleSelect(predictions[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2">
        <MapPin size={15} className="shrink-0 text-dark-gray" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => predictions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          autoFocus={autoFocus}
          className="w-full text-sm text-dark-gray outline-none placeholder:text-light-gray"
        />
        {inputValue ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label="지우기"
            className="shrink-0 text-light-gray transition hover:text-dark-gray"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      {isOpen && predictions.length > 0 ? (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-gray-border bg-white shadow-lg"
        >
          {predictions.map((p, i) => (
            <li
              key={p.placeId}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={() => handleSelect(p)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`flex cursor-pointer items-center gap-2.5 px-4 py-3 transition-colors ${
                i === activeIndex ? "bg-bubble-gray" : "hover:bg-bubble-gray"
              }`}
            >
              <MapPin size={13} className="shrink-0 text-light-gray" />
              <span className="flex min-w-0 flex-1 items-baseline truncate">
                <PlacePredictionInlineDescription
                  prediction={p}
                  matchClassName="font-semibold text-brand-red"
                  primaryTextClassName="text-[13px] text-black"
                  secondaryTextClassName="ml-1.5 truncate text-[11px] text-light-gray"
                />
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
