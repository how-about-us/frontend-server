"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import { AUTH_SESSION_COOKIE } from "@/lib/auth-session";
import { useJoinRoom } from "@/hooks/useRooms";

export const PENDING_INVITE_KEY = "pendingInviteCode";

function hasSession() {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((c) => {
    const [k, v] = c.trim().split("=");
    return k === AUTH_SESSION_COOKIE && v === "1";
  });
}

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const inviteCode = Array.isArray(params.inviteCode)
    ? params.inviteCode[0]
    : params.inviteCode;

  const called = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const { mutate: join } = useJoinRoom();

  useEffect(() => {
    if (called.current || !inviteCode) return;
    called.current = true;

    if (!hasSession()) {
      sessionStorage.setItem(PENDING_INVITE_KEY, inviteCode);
      router.replace("/login");
      return;
    }

    join(inviteCode, {
      onSuccess: (data) => {
        router.replace(
          `/waiting?roomId=${encodeURIComponent(data.id)}&roomTitle=${encodeURIComponent(data.roomTitle)}`,
        );
      },
      onError: (err) => {
        setError(err instanceof Error ? err.message : "입장 요청에 실패했습니다.");
      },
    });
  }, [inviteCode, join, router]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-bubble-gray/80 via-white to-white px-4">
        <Image src="/icons/logo.svg" alt="" width={160} height={26} className="h-7 w-auto" />
        <div className="w-full max-w-sm rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="mb-1 font-semibold text-brand-red">입장 요청 실패</p>
          <p className="text-sm text-dark-gray">{error}</p>
        </div>
        <button
          onClick={() => router.replace("/home")}
          className="text-sm text-dark-gray underline underline-offset-4 hover:text-black"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-bubble-gray/80 via-white to-white px-4">
      <Image src="/icons/logo.svg" alt="" width={160} height={26} className="h-7 w-auto" />
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-border border-t-brand-red" />
      <p className="text-sm text-dark-gray">입장 요청 중…</p>
    </div>
  );
}
