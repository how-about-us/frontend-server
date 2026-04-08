"use client";

import { useState, useReducer } from "react";
import { VIEW_COMPONENTS, type ViewMode } from "@/components/view-components";
import { Map, HeaderBar } from "@/components/ui/index";

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
    <main className="h-screen">
      <div className="relative mx-auto flex h-full w-full overflow-hidden rounded-none border border-gray-border bg-white">
        <section className="flex flex-col flex-1 min-w-[320px] max-w-[720px]">
          <HeaderBar />
          <section className="flex w-full">
            <aside className="flex w-13 shrink-0 flex-col items-center gap-2 border-r border-gray-border bg-white px-3 py-5">
              {" "}
              {sidebarItems.map((item) => {
                const isActive = item.id === activeView;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveView(item.id)}
                    className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
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
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              {VIEW_COMPONENTS[activeView]}
            </div>
          </section>
        </section>

        <section className="flex min-w-[400px] hidden md:block flex-1 border-r border-gray-border">
          <Map />
        </section>
      </div>
    </main>
  );
}
