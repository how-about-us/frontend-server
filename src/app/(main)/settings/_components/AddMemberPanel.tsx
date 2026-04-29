"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

import { useRegenerateInviteCode } from "@/hooks/useRooms";
import { useSessionStore } from "@/stores/session-store";

type Props = {
  roomId: string;
  inviteCode: string | null;
  onClose: () => void;
};

export function AddMemberPanel({ roomId, inviteCode, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const setCurrentRoomInviteCode = useSessionStore(
    (s) => s.setCurrentRoomInviteCode,
  );

  const { mutate: regenerate, isPending: isRegenerating } =
    useRegenerateInviteCode();

  const inviteUrl = inviteCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/join/${inviteCode}`
    : null;

  function handleCopy() {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleRegenerate() {
    regenerate(roomId, {
      onSuccess: ({ inviteCode: newCode }) => {
        setCurrentRoomInviteCode(newCode);
      },
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-border bg-gray-50">
      {/* 패널 헤더 */}
      <div className="flex items-center justify-between border-b border-gray-border bg-white px-4 py-3">
        <span className="text-sm font-semibold text-gray-800">멤버 초대</span>
        <button
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-md text-dark-gray transition-colors hover:bg-gray-100"
          aria-label="닫기"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="M1 1l12 12M13 1L1 13" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-3 p-4">
        <p className="text-xs text-dark-gray">
          아래 초대 링크를 복사해 멤버를 초대하세요.
        </p>

        {/* 초대 링크 */}
        <div className="flex gap-2">
          <div className="flex min-w-0 flex-1 items-center rounded-lg border border-gray-border bg-white px-3 py-2">
            {inviteUrl ? (
              <span className="truncate text-xs text-dark-gray">{inviteUrl}</span>
            ) : (
              <span className="truncate text-xs text-light-gray">
                초대 코드를 불러오는 중…
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!inviteUrl}
            className={`flex-shrink-0 rounded-lg border px-3 py-2 text-xs font-medium transition-colors disabled:opacity-40 ${
              copied
                ? "border-brand-green bg-brand-green/10 text-brand-green"
                : "border-gray-border bg-white text-dark-gray hover:border-gray-400"
            }`}
          >
            {copied ? "복사됨 ✓" : "복사"}
          </button>
        </div>

        {/* 재발급 버튼 */}
        <button
          type="button"
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className="flex items-center gap-1.5 self-start text-xs text-dark-gray transition-colors hover:text-black disabled:opacity-40"
        >
          <RefreshCw
            size={12}
            className={isRegenerating ? "animate-spin" : ""}
          />
          {isRegenerating ? "재발급 중…" : "초대 링크 재발급"}
        </button>
      </div>
    </div>
  );
}
