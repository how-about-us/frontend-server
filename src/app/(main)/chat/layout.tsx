"use client";

import { Minus } from "lucide-react";
import { useRouter } from "next/navigation";
import { MinimizeIcon } from "@/components/icons";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-white">
      <div className="flex shrink-0 items-center justify-between px-3 py-2">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-[10px] bg-light-gray">
            <img
              src="https://picsum.photos/seed/chat-avatar/80/80"
              alt="trip"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold leading-tight">히코네여행</h2>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#68D391]" />
              <span className="text-xs font-semibold text-black/60">
                3 Online
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-full p-2 text-dark-gray transition hover:bg-light-gray"
            aria-label="최소화"
          >
            <MinimizeIcon className="h-5 w-5" stroke="currentColor" />
          </button>
          <button
            onClick={() => router.back()}
            className="rounded-full p-2 text-dark-gray transition hover:bg-light-gray"
            aria-label="채팅 닫기"
          >
            <Minus className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="h-px bg-black/[0.08]" />

      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
