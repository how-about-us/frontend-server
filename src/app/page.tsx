"use client";

import { useState } from "react";
import {
  VIEW_COMPONENTS,
  type ViewMode,
} from "@/components/view-components";

const sidebarItems = [
  { id: "search", icon: "/icons/search.svg" },
  { id: "plan", icon: "/icons/calendar-days.svg" },
  { id: "bookmark", icon: "/icons/bookmark.svg" },
  { id: "chat", icon: "/icons/chat.svg" },
  { id: "settings", icon: "/icons/user-cog.svg" },
] as const;
export default function Home() {
  const [activeView, setActiveView] = useState<ViewMode>("plan");

  return (
    <main className="h-screen bg-[#f6f7fb] text-dark-gray">
      <div className="mx-auto flex h-full w-full max-w-[1440px] overflow-hidden rounded-none border border-[#e5e7eb] bg-white">
        <aside className="flex w-24 shrink-0 flex-col items-center gap-3 border-r border-[#e5e7eb] bg-white px-3 py-5">
          {sidebarItems.map((item) => {
            const isActive = item.id === activeView;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveView(item.id)}
                className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
                  isActive
                    ? "bg-light-gray"
                    : "bg-transparent hover:bg-light-gray"
                }`}
                aria-label={`sidebar-${item.id}`}
              >
                <img src={item.icon} alt="" className="h-5 w-5" />
              </button>
            );
          })}
        </aside>

        <section className="flex min-w-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col border-r border-[#e5e7eb]">
            <header className="border-b border-[#e5e7eb] px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold">히코네 여행</h1>
                  <p className="text-sm text-dark-gray">금요일, 4월 3일</p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-[#e5e7eb] px-4 py-2 text-sm text-dark-gray hover:bg-[#f8fafc]"
                >
                  더보기
                </button>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              {VIEW_COMPONENTS[activeView]}
            </div>
          </div>

          <aside className="sticky top-0 h-screen w-[420px] shrink-0 bg-[#f3f4f6]">
            <div className="relative h-full border-l border-[#e5e7eb]">
              <div className="absolute left-4 top-4 z-10 rounded-full bg-white px-3 py-1 text-xs font-medium text-dark-gray shadow-sm">
                지도 (고정)
              </div>
              <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#e5e7eb_0%,#cbd5e1_100%)]">
                <div className="rounded-2xl border border-white/70 bg-white/70 px-6 py-4 text-center backdrop-blur">
                  <p className="text-sm font-medium text-dark-gray">
                    Map Placeholder
                  </p>
                  <p className="mt-1 text-xs text-dark-gray">
                    실제 지도 SDK 연결 위치
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
