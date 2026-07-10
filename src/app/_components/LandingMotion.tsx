"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type RevealState = "static" | "hidden" | "shown";

type LandingMotionProps = {
  children: ReactNode;
  className?: string;
};

const TRANSITION_CLASSES =
  "transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none";

export function LandingMotion({ children, className }: LandingMotionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<RevealState>("static");

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    if (element.getBoundingClientRect().top < window.innerHeight) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- 뷰포트 하단 요소를 첫 페인트 이전에 hidden 상태로 동기화
    setState("hidden");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setState("shown");
            observer.disconnect();
          }
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        state === "hidden" && cn(TRANSITION_CLASSES, "translate-y-3 opacity-0"),
        state === "shown" && cn(TRANSITION_CLASSES, "translate-y-0 opacity-100"),
        className,
      )}
    >
      {children}
    </div>
  );
}
