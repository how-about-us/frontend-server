import type { Metadata } from "next";

import { LandingView } from "@/app/_components/LandingView";
import { StructuredData } from "@/components/seo/StructuredData";
import { brandAssets } from "@/lib/public-assets";
import { ORGANIZATION_JSON_LD } from "@/lib/public-site-metadata";

const title = "우때 — 실시간 협업 여행 플래너";
const description =
  "우때에서 친구들과 장소를 찾고 대화하며 여행 일정을 함께 완성하세요.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description,
    url: "/",
    siteName: "우때",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: brandAssets.shareImage,
        width: 1200,
        height: 1200,
        alt: "우때",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [brandAssets.shareImage],
  },
};

export default function RootPage() {
  return (
    <>
      <StructuredData id="uttae-organization" data={ORGANIZATION_JSON_LD} />
      <LandingView />
    </>
  );
}
