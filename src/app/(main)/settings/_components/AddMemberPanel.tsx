"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { useRegenerateInviteCode } from "@/hooks/useRooms";
import { useSessionStore } from "@/stores/session-store";

type Props = {
  roomId: string;
  onClose: () => void;
};

/**
 * 패널은 열 때마다 remount되며, 마운트 시 항상 새 초대 코드를 발급합니다.
 * (닫았다 다시 열거나 로컬에 남은 만료·구 코드를 그대로 보여 주지 않기 위함)
 */
export function AddMemberPanel({ roomId, onClose }: Props) {
  const roomIdTrim = roomId.trim();
  const [copied, setCopied] = useState(false);
  const [issuedCode, setIssuedCode] = useState<string | null>(null);
  const setCurrentRoomInviteCode = useSessionStore(
    (s) => s.setCurrentRoomInviteCode,
  );

  const { mutate: regenerate, isPending: isRegenerating } =
    useRegenerateInviteCode();

  useEffect(() => {
    if (!roomIdTrim.length) return;

    setIssuedCode(null);

    regenerate(roomIdTrim, {
      onSuccess: ({ inviteCode: newCode }) => {
        setCurrentRoomInviteCode(newCode);
        setIssuedCode(newCode);
      },
      onError: () => {
        toast.error("초대 링크를 발급하지 못했어요.");
      },
    });
  }, [roomIdTrim, regenerate, setCurrentRoomInviteCode]);

  const inviteUrl = issuedCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/join/${issuedCode}`
    : null;

  function handleCopy() {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleRegenerate() {
    if (!roomIdTrim.length) return;
    setIssuedCode(null);
    regenerate(roomIdTrim, {
      onSuccess: ({ inviteCode: newCode }) => {
        setCurrentRoomInviteCode(newCode);
        setIssuedCode(newCode);
      },
      onError: () => {
        toast.error("초대 링크를 재발급하지 못했어요.");
      },
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-border bg-gray-50">
      <div className="flex items-center justify-between border-b border-gray-border bg-white px-4 py-3">
        <span className="text-sm font-semibold text-gray-800">멤버 초대</span>
        <button
          onClick={onClose}
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-dark-gray transition-colors hover:bg-gray-100"
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
          아래 초대 링크를 복사해 멤버를 초대하세요. 패널을 열 때마다 새 링크로
          갱신됩니다.
        </p>

        <div className="flex gap-2">
          <div className="flex min-w-0 flex-1 items-center rounded-lg border border-gray-border bg-white px-3 py-2">
            {inviteUrl ? (
              <span className="truncate text-xs text-dark-gray">{inviteUrl}</span>
            ) : (
              <span className="truncate text-xs text-light-gray">
                {isRegenerating
                  ? "초대 링크를 발급하는 중…"
                  : "발급에 실패했어요. 아래에서 재발급을 눌러 주세요."}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!inviteUrl}
            className={`flex-shrink-0 cursor-pointer rounded-lg border px-3 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              copied
                ? "border-brand-green bg-brand-green/10 text-brand-green"
                : "border-gray-border bg-white text-dark-gray hover:border-gray-400"
            }`}
          >
            {copied ? "복사됨 ✓" : "복사"}
          </button>
        </div>

        <button
          type="button"
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className="flex cursor-pointer items-center gap-1.5 self-start text-xs text-dark-gray transition-colors hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
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
