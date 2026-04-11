"use client";

import { useState, useRef, useEffect } from "react";

export type FilterOption<T extends string> = { label: string; value: T };

interface FilterDropdownProps<T extends string> {
  label: string;
  options: FilterOption<T>[];
  value: T;
  onChange: (v: T) => void;
}

export function FilterDropdown<T extends string>({
  label,
  options,
  value,
  onChange,
}: FilterDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isActive = value !== "all";
  const selectedLabel = options.find((o) => o.value === value)?.label ?? label;

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium shadow-md transition ${
          isActive
            ? "bg-blue-600 text-white"
            : "bg-white text-black hover:bg-gray-50"
        }`}
      >
        <span>{isActive ? selectedLabel : label}</span>
        <svg
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 4l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1.5 min-w-[136px] overflow-hidden rounded-xl border border-gray-border bg-white shadow-lg">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-xs transition hover:bg-gray-50 ${
                value === opt.value
                  ? "font-semibold text-blue-600"
                  : "text-black"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
