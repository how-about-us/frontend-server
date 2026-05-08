"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

import { useSectionWidth } from "@/contexts/SectionWidthContext";
import { cn } from "@/lib/utils";

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

  return (
    <motion.section
      className={cn(
        "relative flex flex-1 flex-col border-r border-gray-border",
        isPlanPath(pathname) ? "min-w-[500px]" : "min-w-[320px]",
      )}
      initial={false}
      animate={{ maxWidth: maxWidth.trim() ? maxWidth : "none" }}
      transition={WIDTH_TRANSITION}
    >
      {children}
    </motion.section>
  );
}
