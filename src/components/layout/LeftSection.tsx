"use client";

import { motion } from "framer-motion";
import { useSectionWidth } from "@/contexts/SectionWidthContext";

const WIDTH_TRANSITION = {
  duration: 0.45,
  ease: [0.4, 0, 0.2, 1] as const,
};

export default function LeftSection({
  children,
}: {
  children: React.ReactNode;
}) {
  const { maxWidth } = useSectionWidth();

  return (
    <motion.section
      className="relative flex min-w-[320px] flex-1 flex-col border-r border-gray-border"
      initial={false}
      animate={{ maxWidth: maxWidth.trim() ? maxWidth : "none" }}
      transition={WIDTH_TRANSITION}
    >
      {children}
    </motion.section>
  );
}
