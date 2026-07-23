import type { Metadata } from "next";

import { ProductTourView } from "@/app/product/_components/ProductTourView";
import { StructuredData } from "@/components/seo/StructuredData";
import { brandAssets } from "@/lib/public-assets";
import { SOFTWARE_APPLICATION_JSON_LD } from "@/lib/public-site-metadata";

const title = "우때 제품 둘러보기 — 실제 화면으로 보는 협업 여행 플래너";
const description =
  "현재 운영 중인 우때의 장소 탐색, 실시간 채팅, 일정 구성과 AI 기능을 실제 제품 화면으로 확인하세요.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/product" },
  openGraph: {
    title,
    description,
    url: "/product",
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

export default function ProductPage() {
  return (
    <>
      <StructuredData
        id="uttae-software-application"
        data={SOFTWARE_APPLICATION_JSON_LD}
      />
      <ProductTourView />
    </>
  );
}
