"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useChat } from "@/hooks/useChat";
import { useSessionStore } from "@/stores/session-store";
import { SidebarChatUnreadBadge } from "./SidebarChatUnreadBadge";

const SIDEBAR_ITEMS = [
  { key: "search", href: "/search", icon: "/search.svg" },
  { key: "plan", href: "/plan", icon: "/calendar-days.svg" },
  { key: "bookmark", href: "/bookmark", icon: "/bookmark.svg" },
  { key: "settings", href: "/settings", icon: "/user-cog.svg" },
] as const;

function SideBar() {
  const pathname = usePathname();
  const { chatState, openChat } = useChat();
  const pendingJoinRequestsCount = useSessionStore(
    (s) => s.pendingJoinRequestsCount,
  );

  const isChatActive = chatState !== "closed";
  const isOnSettings = pathname.startsWith("/settings");
  const showSettingsNotification =
    pendingJoinRequestsCount > 0 && !isOnSettings;

  return (
    <aside className="flex w-13 shrink-0 flex-col items-center gap-2 border-r border-gray-border bg-white">
      {/* chat - 최상단, brand-red rounded-r 사각형 */}
      <button
        onClick={openChat}
        className={`relative flex w-20 items-center justify-center rounded-br-2xl py-2 transition hover:opacity-80 ${
          isChatActive ? "bg-brand-red/80" : "bg-brand-red"
        }`}
        aria-label="sidebar-chat"
      >
        <img
          src="/chat.svg"
          alt=""
          className="h-9 w-9 brightness-0 invert"
        />

        <SidebarChatUnreadBadge />
      </button>

      <div className="flex flex-col items-center gap-2 px-1">
        {SIDEBAR_ITEMS.map((item) => {
          const href = item.href;
          const isActive =
            item.key === "plan"
              ? pathname === "/plan" || pathname.startsWith("/plan/")
              : pathname.startsWith(item.href);
          const isSettings = item.key === "settings";

          return (
            <div key={item.href} className="relative">
              <Link
                href={href}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
                  isActive
                    ? "bg-light-gray"
                    : "bg-transparent hover:bg-light-gray"
                }`}
                aria-label={`sidebar-${item.href.slice(1)}`}
              >
                <img src={item.icon} alt="" className="h-6 w-6" />
              </Link>

              {/* Notification badge for settings icon */}
              {isSettings && showSettingsNotification && (
                <span className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-red opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-red" />
                </span>
              )}

              {item.key === "bookmark" && (
                <div className="mt-2 w-10 border-t border-gray-border" />
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

export default SideBar;
