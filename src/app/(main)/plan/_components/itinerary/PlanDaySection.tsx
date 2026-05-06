"use client";

import { usePlanItineraryExpandedStore } from "@/stores/plan-itinerary-expanded-store";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useCallback, useId, useState } from "react";
import type { ReactNode } from "react";

export type PlanDaySectionProps = {
  title: string;
  subtitle?: string;
  /** 접힌 상태로 마운트할지 (기본: 펼침) — 일정 스케줄 ID 동기화 시에는 `PlanPageView` 기본값과 같이 동작함 */
  defaultExpanded?: boolean;
  /**
   * 플랜 우측 맵 오버레이와 동일한 펼침 상태(`usePlanItineraryExpandedStore`)를 공유함.
   * 생략 시 로컬 `useState`만 사용합니다.
   */
  itineraryScheduleId?: number | null;
  children?: ReactNode;
  /**
   * 일차(schedule) 단위 삭제 — schedule-item(장소) 삭제와 구분됩니다.
   * 지정 시 헤더 우측에 휴지통 아이콘이 표시됩니다.
   */
  onRequestDeleteSchedule?: () => void;
};

export function PlanDaySection({
  title,
  subtitle,
  defaultExpanded = true,
  itineraryScheduleId,
  children,
  onRequestDeleteSchedule,
}: PlanDaySectionProps) {
  const panelId = useId();

  const trackedSid =
    typeof itineraryScheduleId === "number" &&
    Number.isFinite(itineraryScheduleId) ?
      itineraryScheduleId
    : undefined;

  const [localExpanded, setLocalExpanded] = useState(defaultExpanded);

  /** 객체를 반환하면 매번 새 참조 → useSyncExternalStore 무한 렌더 — 불리언만 선택 */
  const hasKeyInStore = usePlanItineraryExpandedStore(
    (s) =>
      trackedSid !== undefined &&
      Object.prototype.hasOwnProperty.call(
        s.expandedByScheduleId,
        trackedSid,
      ),
  );

  const storedExpanded = usePlanItineraryExpandedStore((s) =>
    trackedSid !== undefined ?
      Boolean(s.expandedByScheduleId[trackedSid])
    : false,
  );

  const expanded =
    trackedSid === undefined ? localExpanded
    : !hasKeyInStore ? defaultExpanded
    : storedExpanded;

  const setScheduleExpanded = usePlanItineraryExpandedStore(
    (s) => s.setScheduleExpanded,
  );

  const toggle = useCallback(() => {
    if (trackedSid !== undefined) {
      setScheduleExpanded(trackedSid, !expanded);
    } else {
      setLocalExpanded((v) => !v);
    }
  }, [trackedSid, expanded, setScheduleExpanded]);

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
        {onRequestDeleteSchedule ? (
          <button
            type="button"
            aria-label="일차 삭제"
            onClick={(e) => {
              e.stopPropagation();
              onRequestDeleteSchedule();
            }}
            className="shrink-0 self-center rounded-lg p-2 text-dark-gray transition-colors hover:bg-bubble-gray/60"
          >
            <Trash2 className="h-5 w-5" aria-hidden />
          </button>
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
