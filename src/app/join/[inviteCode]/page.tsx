"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

import { AUTH_SESSION_COOKIE } from "@/lib/auth-session";
import { setPendingInviteCode } from "@/lib/auth";
import { useJoinRoom } from "@/hooks/useRooms";
import { getRoomDetail } from "@/lib/api/rooms";
import { useSessionStore } from "@/stores/session-store";

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

  const [error, setError] = useState<string | null>(null);

  const { mutate: join } = useJoinRoom();
  const setCurrentRoomId = useSessionStore((s) => s.setCurrentRoomId);
  const setCurrentRoomMeta = useSessionStore((s) => s.setCurrentRoomMeta);

  useEffect(() => {
    if (!inviteCode) return;

    if (!hasSession()) {
      setPendingInviteCode(inviteCode);
      router.replace("/login");
      return;
    }

    join(inviteCode, {
      onSuccess: async (data) => {
        if (data.httpStatus === 200) {
          setCurrentRoomId(data.id);
          try {
            const meta = await getRoomDetail(data.id);
            setCurrentRoomMeta(meta);
          } catch {
            // 메타 조회 실패해도 입장은 진행 (waiting 승인 처리와 동일)
          }
          router.replace("/plan");
          return;
        }
        router.replace(
          `/waiting?roomId=${encodeURIComponent(data.id)}&roomTitle=${encodeURIComponent(data.roomTitle)}`,
        );
      },
      onError: (err) => {
        setError(err instanceof Error ? err.message : "입장 요청에 실패했습니다.");
      },
    });
  }, [inviteCode, join, router, setCurrentRoomId, setCurrentRoomMeta]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-bubble-gray/80 via-white to-white px-4">
        <Image src="/logo.svg" alt="" width={160} height={26} className="h-7 w-auto" />
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
      <Image src="/logo.svg" alt="" width={160} height={26} className="h-7 w-auto" />
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-border border-t-brand-red" />
      <p className="text-sm text-dark-gray">입장 요청 중…</p>
    </div>
  );
}
