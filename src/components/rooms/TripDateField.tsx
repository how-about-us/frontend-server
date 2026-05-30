"use client";

import { useRef, type ChangeEvent } from "react";

import {
  TRIP_DATE_INPUT_CLASS,
} from "@/lib/rooms/trip-form";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  value: string;
  min?: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
};

export function TripDateField({
  id,
  value,
  min,
  onChange,
  readOnly = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = (e: React.MouseEvent) => {
    if (readOnly) return;
    e.preventDefault();
    inputRef.current?.showPicker?.();
  };

  if (readOnly) {
    return (
      <span className="min-w-0 flex-1 text-sm text-dark-gray">{value || "—"}</span>
    );
  }

  return (
    <label
      htmlFor={id}
      onClick={openPicker}
      className="relative flex min-w-0 flex-1 cursor-pointer items-center"
    >
      <input
        id={id}
        ref={inputRef}
        type="date"
        value={value}
        min={min}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        className={cn(
          TRIP_DATE_INPUT_CLASS,
          value ? "text-dark-gray" : "text-light-gray",
        )}
      />
    </label>
  );
}
