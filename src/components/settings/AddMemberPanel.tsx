"use client";

import { useState } from "react";

type Props = {
  onAdd: (name: string) => void;
  onClose: () => void;
};

const INVITE_LINK = "https://how-about.us/join/abc123xyz";

export function AddMemberPanel({ onAdd, onClose }: Props) {
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  function handleCopyLink() {
    navigator.clipboard.writeText(INVITE_LINK).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("이름을 입력해주세요.");
      return;
    }
    onAdd(trimmed);
    setName("");
    setError("");
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-border bg-gray-50">
      {/* 패널 헤더 */}
      <div className="flex items-center justify-between border-b border-gray-border bg-white px-4 py-3">
        <span className="text-sm font-semibold text-gray-800">멤버 추가</span>
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

      <div className="flex flex-col gap-4 p-4">
        {/* 초대 링크 */}
        <div>
          <p className="mb-2 text-xs font-medium text-dark-gray">초대 링크</p>
          <div className="flex gap-2">
            <div className="flex min-w-0 flex-1 items-center rounded-lg border border-gray-border bg-white px-3 py-2">
              <span className="truncate text-xs text-dark-gray">
                {INVITE_LINK}
              </span>
            </div>
            <button
              onClick={handleCopyLink}
              className={`flex-shrink-0 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                copied
                  ? "border-brand-green bg-brand-green/10 text-brand-green"
                  : "border-gray-border bg-white text-dark-gray hover:border-gray-400"
              }`}
            >
              {copied ? "복사됨 ✓" : "복사"}
            </button>
          </div>
        </div>

        {/* 구분선 */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-border" />
          <span className="text-xs text-dark-gray">또는 이름으로 추가</span>
          <div className="h-px flex-1 bg-gray-border" />
        </div>

        {/* 이름 입력 폼 */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              placeholder="멤버 이름 입력"
              className="flex-1 rounded-lg border border-gray-border bg-white px-3 py-2 text-sm outline-none placeholder:text-light-gray focus:border-brand-red"
            />
            <button
              type="submit"
              className="flex-shrink-0 rounded-lg bg-brand-red px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              disabled={!name.trim()}
            >
              추가
            </button>
          </div>
          {error && <p className="text-xs text-brand-red">{error}</p>}
        </form>
      </div>
    </div>
  );
}
