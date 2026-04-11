"use client";

import { useOnClickOutside } from "@/lib/hooks/useOnClickOutside";
import { ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";
import type { ReactNode } from "react";

export type PlanDaySectionProps = {
  title: string;
  subtitle?: string;
  /** 접힌 상태로 마운트할지 (기본: 펼침) */
  defaultExpanded?: boolean;
  children?: ReactNode;
  /** 호출되면 헤더 우측에 메뉴(⋯)가 표시되고, 메뉴에서 일차 삭제 가능 */
  onRequestDeleteDay?: () => void;
};

function PlanDaySectionMenu({ onDelete }: { onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setOpen(false));

  return (
    <div ref={ref} className="relative shrink-0 self-center">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="rounded-lg p-2 text-dark-gray transition-colors hover:bg-bubble-gray/60"
      >
        <MoreHorizontal className="h-5 w-5" aria-hidden />
        <span className="sr-only">일차 메뉴</span>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 min-w-[128px] overflow-hidden rounded-xl border border-gray-border bg-white py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
              setOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-sm text-gray-900 transition-colors hover:bg-bubble-gray/60"
          >
            일차 삭제
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function PlanDaySection({
  title,
  subtitle,
  defaultExpanded = true,
  children,
  onRequestDeleteDay,
}: PlanDaySectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const panelId = useId();
  const toggle = useCallback(() => setExpanded((v) => !v), []);

  return (
    <section
      className="bg-white"
      aria-label={subtitle ? `${title} ${subtitle}` : title}
    >
      <div
        className={`flex w-full items-stretch gap-0.5 py-3.5 ${!expanded ? "border-b border-gray-border" : ""}`}
      >
        <button
          type="button"
          id={`${panelId}-trigger`}
          aria-expanded={expanded}
          aria-controls={`${panelId}-panel`}
          onClick={toggle}
          className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left transition-colors hover:bg-bubble-gray/60"
        >
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            {subtitle ? (
              <p className="mt-0.5 text-xs text-dark-gray">{subtitle}</p>
            ) : null}
          </div>
          <span className="shrink-0 text-dark-gray">
            {expanded ? (
              <ChevronUp className="h-5 w-5" aria-hidden />
            ) : (
              <ChevronDown className="h-5 w-5" aria-hidden />
            )}
          </span>
        </button>
        {onRequestDeleteDay ? (
          <PlanDaySectionMenu onDelete={onRequestDeleteDay} />
        ) : null}
      </div>
      <div
        id={`${panelId}-panel`}
        role="region"
        aria-labelledby={`${panelId}-trigger`}
        hidden={!expanded}
      >
        <div className="px-4 pb-4 pt-1">{children}</div>
      </div>
    </section>
  );
}
