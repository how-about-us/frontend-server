"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useChat } from "@/contexts/ChatContext";

const sidebarItems = [
  { href: "/search", icon: "/icons/search.svg" },
  { href: "/plan", icon: "/icons/calendar-days.svg" },
  { href: "/bookmark", icon: "/icons/bookmark.svg" },
  { href: "/settings", icon: "/icons/user-cog.svg" },
] as const;

export function SideBar() {
  const pathname = usePathname();
  const { chatState, openChat } = useChat();

  const isChatActive = chatState !== "closed";

  return (
    <aside className="flex w-13 shrink-0 flex-col items-center gap-2 border-r border-gray-border bg-white">
      {/* chat - 최상단, brand-red rounded-r 사각형 */}
      <button
        onClick={openChat}
        className={`flex w-20 items-center justify-center rounded-br-2xl py-3 transition hover:opacity-80 ${
          isChatActive ? "bg-brand-red/80" : "bg-brand-red"
        }`}
        aria-label="sidebar-chat"
      >
        <img
          src="/icons/chat.svg"
          alt=""
          className="h-6 w-6 brightness-0 invert"
        />
      </button>

      <div className="flex flex-col items-center gap-2 px-1">
        {sidebarItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
                  isActive
                    ? "bg-light-gray"
                    : "bg-transparent hover:bg-light-gray"
                }`}
                aria-label={`sidebar-${item.href.slice(1)}`}
              >
                <img src={item.icon} alt="" className="h-6 w-6" />
              </Link>
              {item.href === "/bookmark" && (
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
