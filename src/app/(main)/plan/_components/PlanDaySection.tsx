"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useCallback, useId, useState } from "react";
import type { ReactNode } from "react";

export type PlanDaySectionProps = {
  title: string;
  subtitle?: string;
  /** 접힌 상태로 마운트할지 (기본: 펼침) */
  defaultExpanded?: boolean;
  children?: ReactNode;
};

export function PlanDaySection({
  title,
  subtitle,
  defaultExpanded = true,
  children,
}: PlanDaySectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const panelId = useId();
  const toggle = useCallback(() => setExpanded((v) => !v), []);

  return (
    <section
      className="overflow-hidden rounded-2xl border border-gray-border bg-white shadow-sm"
      aria-label={subtitle ? `${title} ${subtitle}` : title}
    >
      <button
        type="button"
        id={`${panelId}-trigger`}
        aria-expanded={expanded}
        aria-controls={`${panelId}-panel`}
        onClick={toggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-bubble-gray/60"
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
      <div
        id={`${panelId}-panel`}
        role="region"
        aria-labelledby={`${panelId}-trigger`}
        hidden={!expanded}
      >
        <div className="border-t border-gray-border px-4 pb-4 pt-1">{children}</div>
      </div>
    </section>
  );
}
