"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function RoomManagementPage() {
  const [createTitle, setCreateTitle] = useState("");
  const [createDate, setCreateDate] = useState("");
  const [joinUrl, setJoinUrl] = useState("");

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-bubble-gray/80 via-white to-white px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(241,45,51,0.06),_transparent_55%)]"
        aria-hidden
      />

      <div className="relative w-full max-w-lg">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/plan"
            className="text-sm font-medium text-dark-gray underline-offset-4 transition hover:text-black hover:underline"
          >
            ← 돌아가기
          </Link>
          <Image
            src="/icons/logo.svg"
            alt=""
            width={140}
            height={24}
            className="h-6 w-auto opacity-90"
          />
        </div>

        <div className="rounded-3xl border border-gray-border bg-white/95 p-6 shadow-[0_24px_80px_-12px_rgba(15,23,42,0.1)] backdrop-blur-sm sm:p-8">
          <h1 className="text-center text-xl font-semibold tracking-tight text-black">
            방 관리
          </h1>
          <p className="mt-1 text-center text-sm text-dark-gray">
            새 여행을 만들거나 초대 링크로 참여하세요.
          </p>

          <div className="mt-8 space-y-10">
            <section aria-labelledby="create-trip-heading">
              <h2
                id="create-trip-heading"
                className="text-sm font-semibold text-black"
              >
                여행 만들기
              </h2>
              <p className="mt-1 text-xs text-dark-gray">
                여행 제목과 일정을 지정할 수 있습니다.
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <label
                    htmlFor="trip-title"
                    className="mb-1.5 block text-xs font-medium text-dark-gray"
                  >
                    여행 제목
                  </label>
                  <input
                    id="trip-title"
                    type="text"
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    placeholder="예: 히코네 여행"
                    className="w-full rounded-xl border border-gray-border bg-white px-3 py-2.5 text-sm outline-none ring-brand-red/20 transition placeholder:text-light-gray focus:border-brand-red focus:ring-2"
                  />
                </div>
                <div>
                  <label
                    htmlFor="trip-date"
                    className="mb-1.5 block text-xs font-medium text-dark-gray"
                  >
                    날짜
                  </label>
                  <input
                    id="trip-date"
                    type="date"
                    value={createDate}
                    onChange={(e) => setCreateDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-border bg-white px-3 py-2.5 text-sm outline-none ring-brand-red/20 transition focus:border-brand-red focus:ring-2"
                  />
                </div>
                <button
                  type="button"
                  className="w-full rounded-xl bg-brand-red py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 active:opacity-90"
                >
                  여행 만들기
                </button>
              </div>
            </section>

            <div className="border-t border-gray-border" />

            <section aria-labelledby="join-trip-heading">
              <h2
                id="join-trip-heading"
                className="text-sm font-semibold text-black"
              >
                여행 참여하기
              </h2>
              <p className="mt-1 text-xs text-dark-gray">
                초대 URL을 입력해 방에 참여합니다.
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <label
                    htmlFor="join-url"
                    className="mb-1.5 block text-xs font-medium text-dark-gray"
                  >
                    초대 URL
                  </label>
                  <input
                    id="join-url"
                    type="url"
                    value={joinUrl}
                    onChange={(e) => setJoinUrl(e.target.value)}
                    placeholder="https://..."
                    autoComplete="off"
                    className="w-full rounded-xl border border-gray-border bg-white px-3 py-2.5 text-sm outline-none ring-brand-red/20 transition placeholder:text-light-gray focus:border-brand-red focus:ring-2"
                  />
                </div>
                <button
                  type="button"
                  className="w-full rounded-xl border-2 border-brand-red bg-white py-3 text-sm font-semibold text-brand-red shadow-sm transition hover:bg-brand-red/5 active:bg-brand-red/10"
                >
                  참여하기
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
