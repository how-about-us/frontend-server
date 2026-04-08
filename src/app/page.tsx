"use client";

import { useState, useReducer } from "react";
import { VIEW_COMPONENTS, type ViewMode } from "@/components/view-components";
import { Map, HeaderBar } from "@/components/ui/index";

const CHAT_ITEM = { id: "chat", icon: "/icons/chat.svg" } as const;

const sidebarItems = [
  { id: "search", icon: "/icons/search.svg" },
  { id: "plan", icon: "/icons/calendar-days.svg" },
  { id: "bookmark", icon: "/icons/bookmark.svg" },
  { id: "settings", icon: "/icons/user-cog.svg" },
] as const;
export default function Home() {
  const [activeView, setActiveView] = useState<ViewMode>("plan");

  return (
    <main className="h-screen">
      <div className="relative mx-auto flex h-full w-full overflow-hidden rounded-none bg-white">
        <section className="relative flex flex-col flex-1 min-w-[320px] max-w-[720px]">
          <HeaderBar />
          <section className="flex w-full h-full">
            <aside className="flex w-13 shrink-0 flex-col items-center gap-2 border-r border-gray-border bg-white">
              {/* chat - 최상단, 사이드바 너비 꽉 채우는 rounded-r 사각형 */}
              <button
                type="button"
                onClick={() => setActiveView(CHAT_ITEM.id)}
                className="flex w-19 items-center justify-center rounded-br-xl bg-brand-red py-3 transition hover:opacity-80"
                aria-label="sidebar-chat"
              >
                <img
                  src={CHAT_ITEM.icon}
                  alt=""
                  className="h-6 w-6 brightness-0 invert"
                />
              </button>

              {sidebarItems.map((item) => {
                const isActive = item.id === activeView;
                return (
                  <div key={item.id}>
                    <button
                      type="button"
                      onClick={() => setActiveView(item.id)}
                      className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
                        isActive
                          ? "bg-light-gray"
                          : "bg-transparent hover:bg-light-gray"
                      }`}
                      aria-label={`sidebar-${item.id}`}
                    >
                      <img src={item.icon} alt="" className="h-6 w-6" />
                    </button>
                    {item.id === "bookmark" && (
                      <div className="items-center justify-center w-10 mt-2 border-t border-gray-border" />
                    )}
                  </div>
                );
              })}
            </aside>
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              {VIEW_COMPONENTS[activeView]}
            </div>
          </section>

          {/* chat 오버레이 - section 전체를 덮음 */}
          {activeView === "chat" && (
            <div className="absolute inset-0 z-10 flex flex-col bg-white">
              <div className="flex items-center justify-between border-b border-gray-border px-6 py-4">
                <h2 className="text-base font-semibold">채팅</h2>
                <button
                  type="button"
                  onClick={() => setActiveView("plan")}
                  className="rounded-full p-2 text-dark-gray hover:bg-light-gray transition"
                  aria-label="채팅 닫기"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {VIEW_COMPONENTS["chat"]}
              </div>
            </div>
          )}
        </section>

        <section className="flex min-w-[400px] hidden md:block flex-1 border-r border-gray-border">
          <Map />
        </section>
      </div>
    </main>
  );
}
