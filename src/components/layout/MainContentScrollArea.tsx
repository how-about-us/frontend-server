"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef } from "react";

import { MAIN_PAGE_INLINE_PADDING_CLASS } from "@/lib/layout-tokens";
import { cn } from "@/lib/utils";

/**
 * (main) 좌측 본문 스크롤 영역 — 레이아웃이 유지되는 동안 브라우저가 scrollTop 을 남겨
 * 다른 탭에서 plan 등으로 올 때 이전 페이지 스크롤이 이어지는 문제를 막습니다.
 */
function isSearchPath(pathname: string): boolean {
  return pathname === "/search";
}

function isPlanPath(pathname: string): boolean {
  return pathname === "/plan" || pathname.startsWith("/plan/");
}

function isBookmarkPath(pathname: string): boolean {
  return pathname === "/bookmark" || pathname.startsWith("/bookmark/");
}

export function MainContentScrollArea({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchPage = isSearchPath(pathname);
  const compactTopPaddingPage =
    isPlanPath(pathname) || isBookmarkPath(pathname);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div
      ref={scrollRef}
      data-main-content-scroll
      className={cn(
        "min-h-0 flex-1 pt-2.5",
        searchPage
          ? "overflow-hidden"
          : "overflow-y-auto [scrollbar-gutter:stable] [scrollbar-color:rgba(0,0,0,0.2)_transparent]",
        searchPage ? "px-0" : MAIN_PAGE_INLINE_PADDING_CLASS,
      )}
    >
      {children}
    </div>
  );
}
