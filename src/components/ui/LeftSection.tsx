"use client";

import { useSectionWidth } from "@/contexts/SectionWidthContext";

export default function LeftSection({
  children,
}: {
  children: React.ReactNode;
}) {
  const { maxWidth } = useSectionWidth();

  return (
    <section
      className="relative flex min-w-[320px] flex-1 flex-col"
      style={maxWidth ? { maxWidth } : undefined}
    >
      {children}
    </section>
  );
}
