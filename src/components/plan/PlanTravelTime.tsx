"use client";

import { ArrowDown } from "lucide-react";

import type { PlanPlace } from "@/mocks/plan";
import { cn } from "@/lib/utils";

export type PlanTravelTimeProps = {
  fromPlace: PlanPlace;
  toPlace: PlanPlace;
  minutes: number;
  className?: string;
};

export function PlanTravelTime({
  fromPlace,
  toPlace,
  minutes,
  className,
}: PlanTravelTimeProps) {
  const label = `${fromPlace.title}에서 ${toPlace.title}까지 약 ${minutes}분`;

  return (
    <div
      className={cn("flex items-stretch gap-3 py-2 pl-1", className)}
      role="separator"
      aria-label={label}
    >
      <div className="flex w-8 shrink-0 flex-col items-center">
        <div className="min-h-3 flex-1 w-px bg-gradient-to-b from-gray-border to-light-gray" />
        <ArrowDown
          className="my-1 h-4 w-4 shrink-0 text-brand-green"
          aria-hidden
        />
        <div className="min-h-3 flex-1 w-px bg-gradient-to-b from-light-gray to-gray-border" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 py-0.5">
        <p className="text-xs leading-snug text-dark-gray">
          <span className="font-medium text-gray-900">{fromPlace.title}</span>
          <span className="mx-1 text-light-gray">→</span>
          <span className="font-medium text-gray-900">{toPlace.title}</span>
        </p>
        <p className="text-xs text-dark-gray/90">약 {minutes}분</p>
      </div>
    </div>
  );
}
