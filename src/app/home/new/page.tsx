"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Calendar } from "lucide-react";

import { BrandLogo } from "@/components/BrandLogo";

import { useCreateRoom } from "@/hooks/useRooms";
import { formatDateYmd } from "@/lib/plan/tripRange";
import { useSessionStore } from "@/stores/session-store";
import { DestinationSearchInput } from "@/components/search/DestinationSearchInput";

const TITLE_MAX_LENGTH = 20;

export default function NewTripPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const setCurrentRoomId = useSessionStore((s) => s.setCurrentRoomId);
  const setCurrentRoomInviteCode = useSessionStore(
    (s) => s.setCurrentRoomInviteCode,
  );
  const { mutate: createRoom, isPending, error } = useCreateRoom();

  const todayYmd = formatDateYmd(new Date());
  const endDateMin =
    startDate && startDate > todayYmd ? startDate : todayYmd;

  const dateRangeInvalid =
    Boolean(startDate && endDate && endDate < startDate);

  const canSubmit =
    title.trim() &&
    destination.trim() &&
    startDate &&
    endDate &&
    !isPending &&
    !dateRangeInvalid;

  const handleSubmit = () => {
    if (!canSubmit || dateRangeInvalid) return;

    createRoom(
      {
        title: title.trim().slice(0, TITLE_MAX_LENGTH),
        destination: destination.trim(),
        startDate,
        endDate,
      },
      {
        onSuccess: (room) => {
          setCurrentRoomId(room.id);
          setCurrentRoomInviteCode(room.inviteCode);
          router.push("/plan");
        },
      },
    );
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="mb-10 flex justify-center">
          <Link
            href="/home"
            className="inline-flex rounded-md outline-none ring-offset-2 transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-brand-red"
          >
            <BrandLogo alt="로고" />
          </Link>
        </div>

        <h1 className="mb-8 text-center text-3xl font-bold tracking-tight text-black">
          새로운 여행 계획하기
        </h1>

        <div className="space-y-3">
          <div className="rounded-2xl border-2 border-gray-border bg-white px-5 py-4 transition focus-within:border-brand-red">
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <p className="text-sm font-bold text-black">여행 제목</p>
              <p className="shrink-0 text-xs tabular-nums text-light-gray">
                {title.length}/{TITLE_MAX_LENGTH}
              </p>
            </div>
            <input
              type="text"
              value={title}
              maxLength={TITLE_MAX_LENGTH}
              onChange={(e) =>
                setTitle(e.target.value.slice(0, TITLE_MAX_LENGTH))
              }
              placeholder="예: 봄 일본 여행, 하와이 신혼여행"
              className="w-full text-sm text-dark-gray outline-none placeholder:text-light-gray"
              autoFocus
            />
          </div>

          <div className="rounded-2xl border-2 border-gray-border bg-white px-5 py-4 transition focus-within:border-brand-red">
            <p className="mb-1.5 text-sm font-bold text-black">어디로?</p>
            <DestinationSearchInput
              value={destination}
              onChange={setDestination}
            />
          </div>

          <div className="rounded-2xl border-2 border-gray-border bg-white px-5 py-4 transition focus-within:border-brand-red">
            <p className="mb-2.5 text-sm font-bold text-dark-gray">날짜</p>
            <div className="flex items-center gap-3">
              <label className="flex flex-1 cursor-pointer items-center gap-2">
                <Calendar size={15} className="shrink-0 text-dark-gray" />
                <input
                  type="date"
                  value={startDate}
                  min={todayYmd}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-sm text-dark-gray outline-none"
                />
              </label>
              <span className="select-none text-light-gray">|</span>
              <label className="flex flex-1 cursor-pointer items-center gap-2">
                <Calendar size={15} className="shrink-0 text-dark-gray" />
                <input
                  type="date"
                  value={endDate}
                  min={endDateMin}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-sm text-dark-gray outline-none"
                />
              </label>
            </div>
            {dateRangeInvalid && (
              <p className="mt-2 text-xs text-brand-red">
                종료일은 시작일 이후여야 해요.
              </p>
            )}
          </div>
        </div>

        {error && (
          <p className="mt-3 text-center text-sm text-brand-red">
            {error instanceof Error
              ? error.message
              : "방 생성에 실패했어요. 다시 시도해주세요."}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="mt-8 w-full rounded-full bg-brand-red py-4 text-base font-semibold text-white shadow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? "생성 중…" : "계획을 시작하세요"}
        </button>

        <Link
          href="/home"
          className="mt-4 block text-center text-sm font-medium text-dark-gray underline-offset-4 transition hover:text-neutral-900 hover:underline"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
