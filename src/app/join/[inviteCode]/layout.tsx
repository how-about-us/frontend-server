import type { Metadata } from "next";
import type { ReactNode } from "react";

import { brandAssets } from "@/lib/public-assets";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const TITLE = "우때 여행 초대";
const DESCRIPTION =
  "우때에서 함께 여행 계획을 세워요. 초대 링크를 눌러 참여해보세요.";
const SHARE_IMAGE_SIZE = 1200;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "우때",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: brandAssets.shareImage,
        width: SHARE_IMAGE_SIZE,
        height: SHARE_IMAGE_SIZE,
        alt: "우때",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [brandAssets.shareImage],
  },
};

export default function JoinInviteLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
