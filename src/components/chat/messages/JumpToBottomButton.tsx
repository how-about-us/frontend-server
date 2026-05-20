"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function JumpToBottomButton({
  onClick,
  isMinimized = false,
}: {
  onClick: () => void;
  isMinimized?: boolean;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
      transition={{ duration: reduceMotion ? 0 : 0.18, ease: "easeOut" }}
      className="pointer-events-none absolute bottom-3 right-3 z-10"
    >
      <button
        type="button"
        onClick={onClick}
        aria-label="가장 아래로 이동"
        className={cn(
          "pointer-events-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-black/[0.08] bg-white text-black/80 shadow-md transition hover:bg-light-gray",
          isMinimized && "h-8 w-8",
        )}
      >
        <ArrowDown
          className={cn(isMinimized ? "h-4 w-4" : "h-[18px] w-[18px]")}
          strokeWidth={2}
          aria-hidden
        />
      </button>
    </motion.div>
  );
}
