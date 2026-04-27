"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Calendar, Users } from "lucide-react";
import { addRoom } from "@/stores/rooms-store";

export default function NewTripPage() {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSubmit = () => {
    if (!destination.trim()) return;
    const newRoom = addRoom(
      destination.trim(),
      startDate || undefined,
      endDate || undefined,
    );
    // replace로 이동해 history에서 /home/new를 제거 → 뒤로가기 시 /home으로
    router.replace(`/plan/${newRoom.id}`);
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
          <div className="rounded-2xl border-2 border-gray-border bg-white px-5 py-4 focus-within:border-brand-red transition">
            <p className="mb-1.5 text-sm font-bold text-black">어디로?</p>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="예: 파리, 하와이, 일본"
              className="w-full text-sm text-dark-gray outline-none placeholder:text-light-gray"
              autoFocus
            />
          </div>

          <div className="rounded-2xl border-2 border-gray-border bg-white px-5 py-4 focus-within:border-brand-red transition">
            <p className="mb-2.5 text-sm font-bold text-dark-gray">
              날짜 (선택 사항)
            </p>
            <div className="flex items-center gap-3">
              <label className="flex flex-1 items-center gap-2 cursor-pointer">
                <Calendar size={15} className="shrink-0 text-dark-gray" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-sm text-dark-gray outline-none"
                  placeholder="시작 날짜"
                />
              </label>
              <span className="select-none text-light-gray">|</span>
              <label className="flex flex-1 items-center gap-2 cursor-pointer">
                <Calendar size={15} className="shrink-0 text-dark-gray" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-sm text-dark-gray outline-none"
                  placeholder="종료 날짜"
                />
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between px-1 py-1">
            <button
              type="button"
              className="flex items-center gap-1.5 text-sm text-dark-gray transition hover:text-black"
            >
              <span className="text-base font-light leading-none">+</span>
              여행 동료 초대
            </button>
            <button
              type="button"
              className="flex items-center gap-1 text-sm text-dark-gray transition hover:text-black"
            >
              <Users size={14} />
              친구
              <svg
                className="h-3 w-3"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M2 4l4 4 4-4" />
              </svg>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!destination.trim()}
          className="mt-8 w-full rounded-full bg-brand-red py-4 text-base font-semibold text-white shadow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          계획을 시작하세요
        </button>
      </div>
    </div>
  );
}
