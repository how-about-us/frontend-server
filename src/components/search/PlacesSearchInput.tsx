"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Search, MapPin, X } from "lucide-react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";

type Prediction = google.maps.places.AutocompletePrediction;

type MenuGeometry = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

type Props = {
  coords: { lat: number; lng: number } | null;
  onSearch: (query: string) => void;
  /** 드롭다운에서 항목 선택 시 (플랜 장소 추가 등). 설정 시 `place_id`로 처리 가능 */
  onPickPrediction?: (prediction: Prediction) => void;
  /** true면 검색 버튼 숨김 — 자동완성 선택만 사용 */
  pickOnly?: boolean;
  disabled?: boolean;
};

export function PlacesSearchInput({
  coords,
  onSearch,
  onPickPrediction,
  pickOnly = false,
  disabled = false,
}: Props) {
  const placesLib = useMapsLibrary("places");

  const [inputValue, setInputValue] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const [menuGeometry, setMenuGeometry] = useState<MenuGeometry | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownListRef = useRef<HTMLUListElement>(null);
  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateMenuGeometry = useCallback(() => {
    const el = containerRef.current;
    if (!el || !isOpen || predictions.length === 0) {
      setMenuGeometry(null);
      return;
    }
    const r = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom - 8;
    const maxH = Math.min(320, Math.max(96, spaceBelow));
    setMenuGeometry({
      top: r.bottom + 4,
      left: r.left,
      width: Math.max(r.width, 200),
      maxHeight: maxH,
    });
  }, [isOpen, predictions.length]);

  useEffect(() => {
    if (!placesLib) return;
    serviceRef.current = new placesLib.AutocompleteService();
  }, [placesLib]);

  /* eslint-disable react-hooks/set-state-in-effect -- 포털 드롭다운 위치는 입력창 DOM 측정 직후에만 갱신 */
  useLayoutEffect(() => {
    updateMenuGeometry();
  }, [updateMenuGeometry, inputValue, pickOnly]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!isOpen || predictions.length === 0) return;
    window.addEventListener("scroll", updateMenuGeometry, true);
    window.addEventListener("resize", updateMenuGeometry);
    return () => {
      window.removeEventListener("scroll", updateMenuGeometry, true);
      window.removeEventListener("resize", updateMenuGeometry);
    };
  }, [isOpen, predictions.length, updateMenuGeometry]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const t = e.target as Node;
      if (containerRef.current?.contains(t)) return;
      if (dropdownListRef.current?.contains(t)) return;
      setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPredictions = useCallback(
    (value: string) => {
      if (disabled) {
        setPredictions([]);
        setIsOpen(false);
        return;
      }
      if (!serviceRef.current || value.trim().length < 2) {
        setPredictions([]);
        setIsOpen(false);
        return;
      }

      const request: google.maps.places.AutocompletionRequest = {
        input: value,
        language: "ko",
        ...(coords && {
          locationBias: {
            center: new google.maps.LatLng(coords.lat, coords.lng),
            radius: 50_000,
          },
        }),
      };

      serviceRef.current.getPlacePredictions(request, (results, status) => {
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
      });
    },
    [coords, disabled],
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setInputValue(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(value), 250);
  }

  function commitSearch(query: string) {
    const trimmed = query.trim();
    if (!trimmed) return;
    setInputValue(trimmed);
    setIsOpen(false);
    setPredictions([]);
    onSearch(trimmed);
  }

  function handleSelectPrediction(prediction: Prediction) {
    if (onPickPrediction) {
      onPickPrediction(prediction);
      setInputValue("");
      setIsOpen(false);
      setPredictions([]);
      setActiveIndex(-1);
      setMenuGeometry(null);
      return;
    }
    const text = prediction.structured_formatting.main_text;
    commitSearch(text);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pickOnly) {
      if (activeIndex >= 0 && predictions[activeIndex]) {
        handleSelectPrediction(predictions[activeIndex]);
      } else if (predictions.length === 1) {
        handleSelectPrediction(predictions[0]);
      }
      return;
    }
    if (activeIndex >= 0 && predictions[activeIndex]) {
      handleSelectPrediction(predictions[activeIndex]);
    } else {
      commitSearch(inputValue);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || predictions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, predictions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  function handleClear() {
    setInputValue("");
    setPredictions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  }

  function renderDescription(prediction: Prediction) {
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
        <span key={`match-${match.offset}`} className="font-semibold text-brand-green">
          {main_text.slice(match.offset, match.offset + match.length)}
        </span>,
      );
      cursor = match.offset + match.length;
    }
    if (cursor < main_text.length) {
      parts.push(<span key="tail">{main_text.slice(cursor)}</span>);
    }

    return (
      <>
        <span className="text-[13px] text-[#111827]">{parts}</span>
        {secondary_text && (
          <span className="ml-1.5 truncate text-[11px] text-[#9ca3af]">
            {secondary_text}
          </span>
        )}
      </>
    );
  }

  const dropdown =
    isOpen &&
    predictions.length > 0 &&
    menuGeometry &&
    typeof document !== "undefined"
      ? createPortal(
          <ul
            ref={dropdownListRef}
            role="listbox"
            style={{
              position: "fixed",
              top: menuGeometry.top,
              left: menuGeometry.left,
              width: menuGeometry.width,
              maxHeight: menuGeometry.maxHeight,
              zIndex: 200,
            }}
            className="overflow-y-auto overflow-x-hidden rounded-xl border border-gray-border bg-white shadow-lg"
          >
            {predictions.map((prediction, i) => (
              <li
                key={prediction.place_id}
                role="option"
                aria-selected={i === activeIndex}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectPrediction(prediction);
                }}
                onMouseEnter={() => setActiveIndex(i)}
                className={`flex cursor-pointer items-center gap-2.5 px-3 py-2.5 transition-colors ${
                  i === activeIndex ? "bg-gray-50" : "hover:bg-gray-50"
                }`}
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-[#9ca3af]" />
                <span className="flex min-w-0 flex-1 items-baseline gap-0 truncate">
                  {renderDescription(prediction)}
                </span>
              </li>
            ))}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex flex-1 items-center">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-dark-gray" />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            disabled={disabled}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => predictions.length > 0 && setIsOpen(true)}
            placeholder="장소를 검색하세요"
            autoComplete="off"
            className="w-full rounded-lg border border-gray-border bg-white py-2 pl-9 pr-8 text-sm outline-none placeholder:text-[#99A1AF] focus:border-brand-green focus:ring-1 focus:ring-brand-green disabled:cursor-not-allowed disabled:opacity-60"
          />
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2.5 text-[#99A1AF] hover:text-[#364153]"
              aria-label="지우기"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {!pickOnly ? (
          <button
            type="submit"
            disabled={!inputValue.trim() || disabled}
            className="shrink-0 rounded-lg bg-brand-green px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            검색
          </button>
        ) : null}
      </form>

      {dropdown}
    </div>
  );
}
