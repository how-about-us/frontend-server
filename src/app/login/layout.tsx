import type { Metadata } from "next";
import type { ReactNode } from "react";

import { NOINDEX_FOLLOW_METADATA } from "@/lib/public-site-metadata";

export const metadata: Metadata = NOINDEX_FOLLOW_METADATA;

export default function LoginLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
