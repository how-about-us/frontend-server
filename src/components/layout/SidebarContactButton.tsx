"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp } from "lucide-react";

import { sidebarNavButtonClassName } from "./sidebarNavButton";

export function SidebarContactButton() {
  const pathname = usePathname();
  const isActive = pathname.startsWith("/contact");

  return (
    <Link
      href="/contact"
      className={sidebarNavButtonClassName(isActive)}
      aria-label="문의하기"
    >
      <CircleHelp
        className="h-6 w-6 text-dark-gray"
        strokeWidth={2}
        aria-hidden
      />
    </Link>
  );
}
