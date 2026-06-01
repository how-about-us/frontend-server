"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { SettingsActionButton } from "@/components/settings/SettingsActionButton";

export function LandingActionLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const router = useRouter();

  return (
    <SettingsActionButton
      variant="primary"
      flex={false}
      className={className}
      onClick={() => router.push(href)}
    >
      {children}
    </SettingsActionButton>
  );
}
