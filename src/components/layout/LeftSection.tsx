"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { useChat } from "@/hooks/useChat";
import { useSectionWidth } from "@/contexts/SectionWidthContext";
import { width, CHAT_PANEL_DOCKED_WIDTH } from "@/lib/layout-tokens";

const WIDTH_TRANSITION = {
  duration: 0.45,
  ease: [0.4, 0, 0.2, 1] as const,
};

function isPlanPath(pathname: string): boolean {
  return pathname === "/plan" || pathname.startsWith("/plan/");
}

export default function LeftSection({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { maxWidth } = useSectionWidth();
  const { chatState } = useChat();

  const planPath = isPlanPath(pathname);

  const animateMaxWidth = useMemo(() => {
    if (planPath) {
      return chatState === "maximized" ? width.s1 : width.s2;
    }
    return maxWidth.trim() ? maxWidth : "none";
  }, [planPath, maxWidth, chatState]);

  const animateMinWidth = CHAT_PANEL_DOCKED_WIDTH;

  return (
    <motion.section
      className="relative flex flex-1 flex-col border-r border-gray-border"
      initial={false}
      animate={{
        maxWidth: animateMaxWidth,
        minWidth: animateMinWidth,
      }}
      transition={WIDTH_TRANSITION}
    >
      {children}
    </motion.section>
  );
}
