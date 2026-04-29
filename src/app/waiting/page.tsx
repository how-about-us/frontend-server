"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

import { useRoomsList } from "@/hooks/useRooms";
import { useSessionStore } from "@/stores/session-store";

function WaitingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const roomId = searchParams.get("roomId") ?? "";
  const roomTitle = searchParams.get("roomTitle") ?? "여행 방";

  const setCurrentRoomId = useSessionStore((s) => s.setCurrentRoomId);
  const approvedRef = useRef(false);

  const { data: roomsData } = useRoomsList();

  useEffect(() => {
    if (approvedRef.current || !roomId || !roomsData) return;
    const joined = roomsData.rooms.find((r) => r.id === roomId);
    if (joined) {
      approvedRef.current = true;
      setCurrentRoomId(roomId);
      router.replace(`/plan/${roomId}`);
    }
  }, [roomsData, roomId, router, setCurrentRoomId]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-10 overflow-hidden bg-gradient-to-b from-bubble-gray/60 via-white to-white px-4 py-12">
      {/* subtle red radial glow */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(241,45,51,0.07),_transparent_55%)]"
        aria-hidden
      />

      <Image
        src="/icons/logo.svg"
        alt=""
        width={160}
        height={26}
        className="relative h-7 w-auto"
        priority
      />

      <div className="relative w-full max-w-sm rounded-3xl border border-gray-border bg-white/95 p-8 shadow-[0_24px_80px_-12px_rgba(15,23,42,0.10)] backdrop-blur-sm">
        {/* Pulsing ring animation */}
        <div className="mb-8 flex items-center justify-center">
          <div className="relative flex h-24 w-24 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-red/20" />
            <span className="absolute inline-flex h-16 w-16 animate-ping rounded-full bg-brand-red/15 [animation-delay:0.4s]" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-brand-red/10">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-brand-red"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
        </div>

        <div className="mb-6 text-center">
          <h1 className="mb-2 text-lg font-semibold text-gray-800">
            입장 승인 대기 중
          </h1>
          <p className="text-sm leading-relaxed text-dark-gray">
            <span className="font-medium text-gray-800">{roomTitle}</span> 방의
            방장이 입장 요청을 확인 중입니다.
            <br />
            승인되면 자동으로 이동됩니다.
          </p>
        </div>

        {/* progress dots */}
        <div className="flex items-center justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 animate-bounce rounded-full bg-brand-red/60"
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </div>
      </div>

      <p className="relative text-xs text-light-gray">
        페이지를 닫아도 승인 후에 로그인하면 참가 완료됩니다.
      </p>
    </div>
  );
}

export default function WaitingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-bubble-gray/80 via-white to-white">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-border border-t-brand-red" />
        </div>
      }
    >
      <WaitingContent />
    </Suspense>
  );
}
