"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const CHAT_ITEM = { href: "/chat", icon: "/icons/chat.svg" } as const;

const sidebarItems = [
  { href: "/search", icon: "/icons/search.svg" },
  { href: "/plan", icon: "/icons/calendar-days.svg" },
  { href: "/bookmark", icon: "/icons/bookmark.svg" },
  { href: "/settings", icon: "/icons/user-cog.svg" },
] as const;

export function SideBar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-13 shrink-0 flex-col items-center gap-2 border-r border-gray-border bg-white">
      {/* chat - 최상단, brand-red rounded-r 사각형 */}
      <Link
        href={CHAT_ITEM.href}
        className="flex w-20 items-center justify-center rounded-br-2xl bg-brand-red py-3 transition hover:opacity-80"
        aria-label="sidebar-chat"
      >
        <img
          src={CHAT_ITEM.icon}
          alt=""
          className="h-6 w-6 brightness-0 invert"
        />
      </Link>

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
