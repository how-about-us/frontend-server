"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Calendar } from "lucide-react";

import { useCreateRoom } from "@/hooks/useRooms";
import { useSessionStore } from "@/stores/session-store";
import { DestinationSearchInput } from "@/components/search/DestinationSearchInput";

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

  const canSubmit = title.trim() && destination.trim() && !isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    createRoom(
      {
        title: title.trim(),
        destination: destination.trim(),
        startDate: startDate || new Date().toISOString().split("T")[0],
        endDate: endDate || new Date().toISOString().split("T")[0],
      },
      {
        onSuccess: (room) => {
          setCurrentRoomId(room.id);
          setCurrentRoomInviteCode(room.inviteCode);
          router.replace(`/plan/${room.id}`);
        },
      },
    );
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="mb-10 flex justify-center">
          <Image src="/icons/logo.svg" alt="로고" width={140} height={20} />
        </div>

        <h1 className="mb-8 text-center text-3xl font-bold tracking-tight text-black">
          새로운 여행 계획하기
        </h1>

        <div className="space-y-3">
          <div className="rounded-2xl border-2 border-gray-border bg-white px-5 py-4 transition focus-within:border-brand-red">
            <p className="mb-1.5 text-sm font-bold text-black">여행 제목</p>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
            <p className="mb-2.5 text-sm font-bold text-dark-gray">
              날짜 (선택 사항)
            </p>
            <div className="flex items-center gap-3">
              <label className="flex flex-1 cursor-pointer items-center gap-2">
                <Calendar size={15} className="shrink-0 text-dark-gray" />
                <input
                  type="date"
                  value={startDate}
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
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-sm text-dark-gray outline-none"
                />
              </label>
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-center text-sm text-brand-red">
            방 생성에 실패했어요. 다시 시도해주세요.
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
      </div>
    </div>
  );
}
