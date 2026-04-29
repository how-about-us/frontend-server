"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin, X } from "lucide-react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";

type Prediction = google.maps.places.AutocompletePrediction;

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
};

/**
 * 구글 Places Autocomplete 기반 목적지 검색 인풋.
 * types: ['(regions)'] 로 국가 · 행정구역 · 도시 단위만 노출합니다.
 */
export function DestinationSearchInput({
  value,
  onChange,
  placeholder = "예: 도쿄, 파리, 제주도",
  autoFocus = false,
}: Props) {
  const placesLib = useMapsLibrary("places");

  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const [committed, setCommitted] = useState(!!value);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!placesLib) return;
    serviceRef.current = new placesLib.AutocompleteService();
  }, [placesLib]);

  // sync external reset (e.g. clear button from parent)
  useEffect(() => {
    if (!value) {
      setInputValue("");
      setCommitted(false);
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        // restore committed value if user blurs without selecting
        if (!committed) setInputValue(value);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [committed, value]);

  const fetchPredictions = useCallback((query: string) => {
    if (!serviceRef.current || query.trim().length < 1) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }

    serviceRef.current.getPlacePredictions(
      {
        input: query,
        language: "ko",
        types: ["(regions)"],
      },
      (results, status) => {
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          results?.length
        ) {
          setPredictions(results);
          setIsOpen(true);
          setActiveIndex(-1);
        } else {
          setPredictions([]);
          setIsOpen(false);
        }
      },
    );
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setInputValue(v);
    setCommitted(false);
    onChange("");

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(v), 250);
  }

  function handleSelect(prediction: Prediction) {
    const label = prediction.description;
    setInputValue(label);
    onChange(label);
    setCommitted(true);
    setPredictions([]);
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function handleClear() {
    setInputValue("");
    onChange("");
    setCommitted(false);
    setPredictions([]);
    setIsOpen(false);
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

  function renderLabel(prediction: Prediction) {
    const { main_text, main_text_matched_substrings, secondary_text } =
      prediction.structured_formatting;

    const parts: React.ReactNode[] = [];
    let cursor = 0;
    for (const match of main_text_matched_substrings ?? []) {
      if (match.offset > cursor) {
        parts.push(
          <span key={`pre-${match.offset}`}>
            {main_text.slice(cursor, match.offset)}
          </span>,
        );
      }
      parts.push(
        <span key={`m-${match.offset}`} className="font-semibold text-brand-red">
          {main_text.slice(match.offset, match.offset + match.length)}
        </span>,
      );
      cursor = match.offset + match.length;
    }
    if (cursor < main_text.length)
      parts.push(<span key="tail">{main_text.slice(cursor)}</span>);

    return (
      <>
        <span className="text-[13px] text-black">{parts}</span>
        {secondary_text && (
          <span className="ml-1.5 truncate text-[11px] text-light-gray">
            {secondary_text}
          </span>
        )}
      </>
    );
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
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="지우기"
            className="shrink-0 text-light-gray transition hover:text-dark-gray"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && predictions.length > 0 && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-gray-border bg-white shadow-lg"
        >
          {predictions.map((p, i) => (
            <li
              key={p.place_id}
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
                {renderLabel(p)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
