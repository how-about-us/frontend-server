"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Bell, Share2, Trash2 } from "lucide-react";

import { useOnClickOutside } from "@/lib/hooks/useOnClickOutside";
import { AUTH_SESSION_COOKIE } from "@/lib/auth-session";
import { useRooms, removeRoom } from "@/stores/rooms-store";
import { useSessionStore } from "@/stores/session-store";

export default function HomePage() {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(profileRef, () => setProfileOpen(false));

  const { rooms } = useRooms();
  const user = useSessionStore((s) => s.user);
  const clearUser = useSessionStore((s) => s.clearUser);

  const handleLogout = () => {
    document.cookie = `${AUTH_SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    clearUser();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 border-b border-gray-border bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <Image
            src="/icons/logo.svg"
            alt="로고"
            width={140}
            height={20}
            className="h-5 w-auto"
          />
          <div className="flex items-center gap-3">
            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-red text-xs font-semibold text-white transition hover:opacity-90"
                aria-label="프로필"
                aria-expanded={profileOpen}
              >
                {user?.avatarInitial ?? "?"}
              </button>
              {profileOpen && (
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
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">나의 여행 계획</h1>
          <Link
            href="/home/new"
            className="flex items-center gap-1.5 rounded-full bg-brand-red px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            + 새 여행 계획
          </Link>
        </div>

        <div className="mt-6">
          {rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-border py-20 text-center">
              <p className="text-sm font-medium text-dark-gray">
                아직 여행이 없어요
              </p>
              <p className="mt-1 text-xs text-light-gray">
                새 여행 계획을 만들어 시작해보세요
              </p>
              <Link
                href="/home/new"
                className="mt-4 rounded-full bg-brand-red px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                + 새 여행 계획
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
              {rooms.map((room) => (
                <div key={room.id} className="group">
                  <div className="relative">
                    <div
                      className={`aspect-[4/3] w-full overflow-hidden rounded-xl bg-gradient-to-br ${room.gradient}`}
                    />
                    <div className="absolute right-2 top-2 flex gap-1.5">
                      <button
                        type="button"
                        className="flex h-6 w-auto items-center gap-1 rounded-full bg-white/90 px-2 text-[11px] font-medium text-dark-gray shadow backdrop-blur-sm transition hover:bg-white"
                      >
                        <Share2 size={10} />
                        공유
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRoom(room.id)}
                        className="flex h-6 w-auto items-center gap-1 rounded-full bg-white/90 px-2 text-[11px] font-medium text-dark-gray shadow backdrop-blur-sm transition hover:bg-white"
                      >
                        <Trash2 size={10} />
                        삭제
                      </button>
                    </div>
                  </div>
                  <Link href={`/plan/${room.id}`} className="mt-2 block">
                    <p className="text-sm font-semibold">{room.title}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-dark-gray">
                      <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-red text-[9px] font-bold text-white">
                        {user?.avatarInitial ?? "?"}
                      </span>
                      {room.date && <span>· {room.date}</span>}
                      <span>· {room.places}곳</span>
                    </p>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
