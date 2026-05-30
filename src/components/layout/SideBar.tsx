"use client";

import { usePathname } from "next/navigation";

import { useChat } from "@/hooks/useChat";
import { useHostJoinRequestsBadgeCount } from "@/hooks/useHostJoinRequestsBadgeCount";

import { SidebarChatUnreadBadge } from "./SidebarChatUnreadBadge";
import { SidebarFeedbackFormButton } from "./SidebarFeedbackFormButton";
import { SidebarNavItem } from "./SidebarNavItem";

const SIDEBAR_ITEMS = [
  { key: "search", href: "/search", icon: "/search.svg" },
  { key: "plan", href: "/plan", icon: "/calendar-days.svg" },
  { key: "bookmark", href: "/bookmark", icon: "/bookmark.svg" },
  { key: "member-settings", href: "/member-settings", icon: "/user-cog.svg" },
  { key: "room-settings", href: "/room-settings", icon: "/settings.svg" },
] as const;

function isSidebarItemActive(pathname: string, key: string, href: string) {
  if (key === "plan") {
    return pathname === "/plan" || pathname.startsWith("/plan/");
  }
  return pathname.startsWith(href);
}

function SideBar() {
  const pathname = usePathname();
  const { chatState, openChat } = useChat();
  const pendingJoinRequestsCount = useHostJoinRequestsBadgeCount();

  const isChatActive = chatState !== "closed";
  const isOnMemberSettings = pathname.startsWith("/member-settings");
  const isOnRoomSettings = pathname.startsWith("/room-settings");
  const isOnSettingsArea = isOnMemberSettings || isOnRoomSettings;
  const showSettingsNotification =
    pendingJoinRequestsCount > 0 && !isOnSettingsArea;

  return (
    <aside className="flex h-full w-13 shrink-0 flex-col items-center gap-2 border-r border-gray-border bg-white">
      <button
        onClick={openChat}
        className={`relative flex w-20 cursor-pointer items-center justify-center rounded-br-2xl py-2 transition hover:opacity-80 ${
          isChatActive ? "bg-brand-red/80" : "bg-brand-red"
        }`}
        aria-label="sidebar-chat"
      >
        <img src="/chat.svg" alt="" className="h-9 w-9 brightness-0 invert" />
        <SidebarChatUnreadBadge />
      </button>

      <div className="flex flex-col items-center gap-2 px-1">
      {SIDEBAR_ITEMS.map((item) => (
        <SidebarNavItem
          key={item.href}
          href={item.href}
          icon={item.icon}
          label={`sidebar-${item.href.slice(1)}`}
          isActive={isSidebarItemActive(pathname, item.key, item.href)}
          showPingBadge={
            item.key === "member-settings" && showSettingsNotification
          }
          showDividerBelow={item.key === "bookmark"}
        />
      ))}

      </div>

      <div className="mt-auto px-1 pb-4">
        <SidebarFeedbackFormButton />
      </div>
    </aside>
  );
}

export default SideBar;
