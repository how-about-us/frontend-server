"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import { useCurrentAgreements } from "@/hooks/useCurrentAgreements";
import { agreementPathForType } from "@/lib/agreements/paths";

export type LoginAgreementsState = {
  isLoading: boolean;
  isError: boolean;
  canProceed: boolean;
};

type Props = {
  onStateChange: (state: LoginAgreementsState) => void;
};

export function LoginAgreementsSection({ onStateChange }: Props) {
  const { data, isPending, isError, error, refetch } = useCurrentAgreements();
  const items = data?.items ?? [];
  const [allAccepted, setAllAccepted] = useState(false);

  const canProceed = !isPending && !isError && items.length > 0 && allAccepted;

  useEffect(() => {
    onStateChange({
      isLoading: isPending,
      isError,
      canProceed,
    });
  }, [isPending, isError, canProceed, onStateChange]);

  if (isPending) {
    return (
      <div className="w-full rounded-xl border border-gray-border bg-bubble-gray/40 px-4 py-3 text-left">
        <p className="text-sm text-dark-gray">약관을 불러오는 중…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full rounded-xl border border-brand-red/35 bg-brand-red/[0.06] px-4 py-3 text-left">
        <p className="text-sm font-medium text-brand-red">
          약관을 불러오지 못했습니다
        </p>
        <p className="mt-1 text-sm text-muted-brown">
          {error instanceof Error
            ? error.message
            : "잠시 후 다시 시도해 주세요."}
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-2 text-sm font-medium text-brand-red underline-offset-2 hover:underline"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="w-full rounded-xl border border-gray-border bg-bubble-gray/30 px-4 py-3 text-left">
        <p className="text-sm text-dark-gray">
          약관 정보를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-gray-border bg-bubble-gray/25 px-4 py-4 text-left">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded accent-brand-red"
          checked={allAccepted}
          onChange={(e) => setAllAccepted(e.target.checked)}
        />
        <span className="text-sm font-semibold leading-snug text-neutral-900">
          필수 약관 전체 동의
        </span>
      </label>

      <ul className="mt-3 space-y-1 border-t border-gray-border/80 pt-3">
        {items.map((item) => (
          <li key={`${item.type}:${item.version}`}>
            <Link
              href={agreementPathForType(item.type)}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/80"
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="inline-flex h-[18px] shrink-0 items-center rounded px-1 text-[10px] font-semibold leading-none text-brand-red">
                  필수
                </span>
                <span className="text-sm text-neutral-800">{item.title}</span>
              </span>
              <span className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-dark-gray group-hover:text-neutral-900">
                자세히 보기
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
