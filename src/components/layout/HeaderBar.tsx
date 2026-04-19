"use client";

import Image from "next/image";
import Link from "next/link";
import { useOnClickOutside } from "@/lib/hooks/useOnClickOutside";
import { MOCK_TRIP_INFO } from "@/mocks";
import { useRef, useState } from "react";

const HeaderBar = () => {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(MOCK_TRIP_INFO[0]?.id ?? "");
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setOpen(false));

  const selected =
    MOCK_TRIP_INFO.find((t) => t.id === selectedId) ?? MOCK_TRIP_INFO[0];

  return (
    <header className="border-b border-gray-border px-1 py-1">
      <div className="flex items-center justify-between">
        <div
          ref={ref}
          className="relative min-w-0 max-w-[min(100%,320px)] shrink"
        >
          <div className="rounded-lg border-r-3 border-brand-red bg-white">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left transition hover:bg-gray-50"
              aria-expanded={open}
              aria-haspopup="listbox"
            >
              <div className="min-w-0">
                <h1 className="truncate text-sm font-semibold leading-tight">
                  {selected.title}
                </h1>
                <p className="truncate text-xs text-dark-gray leading-tight">
                  {selected.date}
                </p>
              </div>
              <svg
                className={`h-3.5 w-3.5 shrink-0 text-dark-gray transition-transform ${
                  open ? "rotate-180" : ""
                }`}
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M2 4l4 4 4-4" />
              </svg>
            </button>

            {open && (
              <div className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-xl border-2 border-gray-border bg-white shadow-lg">
                <ul
                  role="listbox"
                  className="max-h-[min(60vh,280px)] overflow-y-auto"
                >
                  {MOCK_TRIP_INFO.map((trip) => (
                    <li key={trip.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={trip.id === selectedId}
                        onClick={() => {
                          setSelectedId(trip.id);
                          setOpen(false);
                        }}
                        className={`w-full px-2.5 py-2 text-left transition hover:bg-gray-50 ${
                          trip.id === selectedId
                            ? "bg-gray-50 font-semibold text-brand-green"
                            : "text-black"
                        }`}
                      >
                        <span className="block text-xs font-semibold leading-tight">
                          {trip.title}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-tight text-dark-gray">
                          {trip.date}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="border-t-2 border-gray-border">
                  <Link
                    href="/room"
                    onClick={() => setOpen(false)}
                    className="block w-full px-2.5 py-2 text-left text-xs font-medium leading-tight text-brand-green transition hover:bg-gray-50"
                  >
                    <span className="text-xs font-medium leading-tight text-brand-red">
                      여행 만들기 / 참여하기
                    </span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
        <Image alt="logo" src="/icons/logo.svg" width={150} height={20} />
      </div>
    </header>
  );
};

export default HeaderBar;
