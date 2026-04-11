"use client";

import { useEffect, useRef, useState } from "react";
import type { RoomMember } from "@/mocks/members";

type Props = {
  member: RoomMember;
  isViewerAdmin: boolean;
  onKick: (memberId: string) => void;
  onTransfer: (memberId: string) => void;
};

export function MemberCard({
  member,
  isViewerAdmin,
  onKick,
  onTransfer,
}: Props) {
  const canAct =
    isViewerAdmin && !member.isCurrentUser && member.role !== "ADMIN";

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-gray-50">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-red/10 text-sm font-semibold text-brand-red">
          {member.avatarInitial}
        </div>
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
            member.status === "online" ? "bg-brand-green" : "bg-light-gray"
          }`}
        />
      </div>

      {/* Name + role */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium text-gray-800">
            {member.name}
          </span>
          {member.isCurrentUser && (
            <span className="text-xs text-dark-gray">(나)</span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span
            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
              member.role === "ADMIN"
                ? "bg-brand-red/10 text-brand-red"
                : "bg-gray-100 text-dark-gray"
            }`}
          >
            {member.role}
          </span>
          <span className="text-xs text-dark-gray">
            {member.status === "online" ? "접속 중" : "오프라인"}
          </span>
        </div>
      </div>

      {/* ··· dropdown — ADMIN only, non-self, non-ADMIN targets */}
      {canAct && (
        <div ref={menuRef} className="relative flex-shrink-0">
          <button
            onClick={() => setOpen((v) => !v)}
            className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors ${
              open
                ? "border-gray-300 bg-gray-100 text-gray-700"
                : "border-transparent text-dark-gray hover:border-gray-border hover:bg-gray-50"
            }`}
            aria-label="멤버 옵션"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <circle cx="2" cy="7" r="1.4" />
              <circle cx="7" cy="7" r="1.4" />
              <circle cx="12" cy="7" r="1.4" />
            </svg>
          </button>

          {open && (
            <div className="absolute right-0 top-full z-10 mt-1 w-32 rounded-xl border border-gray-border bg-white shadow-md">
              <button
                onClick={() => {
                  onTransfer(member.id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="flex-shrink-0 text-dark-gray"
                >
                  <path d="M6 1v10M1 6l5-5 5 5" />
                </svg>
                방장 위임
              </button>
              <div className="mx-3 h-px bg-gray-border" />
              <button
                onClick={() => {
                  onKick(member.id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-medium text-brand-red transition-colors hover:bg-brand-red/5"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  className="flex-shrink-0"
                >
                  <path d="M1 1l10 10M11 1L1 11" />
                </svg>
                강제 퇴장
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
