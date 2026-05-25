"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { useMobileView } from "@/contexts/MobileViewContext";
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
  const { isMobileDevice } = useMobileView();

  const planPath = isPlanPath(pathname);

  const animateMaxWidth = useMemo(() => {
    if (isMobileDevice) return "100%";
    if (planPath) {
      return chatState === "maximized" ? width.s1 : width.s2;
    }
    return maxWidth.trim() ? maxWidth : "none";
  }, [isMobileDevice, planPath, maxWidth, chatState]);

  const animateMinWidth = isMobileDevice ? 0 : CHAT_PANEL_DOCKED_WIDTH;

  return (
    <motion.section
      className={`relative flex flex-1 flex-col ${isMobileDevice ? "min-w-0 w-full border-r-0" : "border-r border-gray-border"}`}
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
