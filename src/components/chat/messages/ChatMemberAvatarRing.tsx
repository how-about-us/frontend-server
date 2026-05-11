"use client";

import { cn } from "@/lib/utils";
import { Ban } from "lucide-react";

export function ChatMemberAvatarRing({
  avatarUrl,
  alt,
  senderNotInRoom,
  chromeAvatarClassName,
  reduceMotion,
}: {
  avatarUrl?: string;
  alt: string;
  chromeAvatarClassName: string;
  senderNotInRoom?: boolean;
  reduceMotion: boolean | null;
}) {
  return (
    <div className={cn(chromeAvatarClassName, "relative bg-light-gray")}>
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- 멤버 프로필 URL 가변
        <img
          src={avatarUrl}
          alt={alt}
          className={cn(
            "h-full w-full object-cover",
            senderNotInRoom && "brightness-[0.88]",
            !reduceMotion && "transition-opacity duration-150 ease-out",
          )}
        />
      ) : null}
      {senderNotInRoom ? (
        <span
          className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[inherit] bg-black/30"
          aria-hidden
        >
          <Ban
            className="h-[52%] w-[52%] text-white drop-shadow-md"
            strokeWidth={2.4}
          />
        </span>
      ) : null}
    </div>
  );
}
