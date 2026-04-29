"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { useOnClickOutside } from "@/lib/hooks/useOnClickOutside";
import { AUTH_SESSION_COOKIE } from "@/lib/auth-session";
import { useSessionStore } from "@/stores/session-store";

export function HomeHeader() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(profileRef, () => setOpen(false));

  const user = useSessionStore((s) => s.user);
  const clearUser = useSessionStore((s) => s.clearUser);

  const handleLogout = () => {
    document.cookie = `${AUTH_SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    clearUser();
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-10 border-b border-gray-border bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
        <Image
          src="/icons/logo.svg"
          alt="로고"
          width={140}
          height={20}
          className="h-5 w-auto"
        />

        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-red text-xs font-semibold text-white transition hover:opacity-90"
            aria-label="프로필"
            aria-expanded={open}
          >
            {user?.avatarInitial ?? "?"}
          </button>

          {open && (
            <div className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-xl border border-gray-border bg-white shadow-lg">
              {user && (
                <div className="border-b border-gray-border px-4 py-2.5">
                  <p className="truncate text-xs font-semibold text-black">
                    {user.name}
                  </p>
                  <p className="truncate text-[11px] text-dark-gray">
                    {user.email}
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full px-4 py-2.5 text-left text-sm text-dark-gray transition hover:bg-bubble-gray"
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
