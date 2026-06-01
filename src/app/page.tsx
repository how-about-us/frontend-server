import type { Metadata } from "next";

import { LandingView } from "@/app/_components/LandingView";

export const metadata: Metadata = {
  title: "우때 — 실시간 협업 여행 플래너",
  description:
    "함께 만드는 여행 계획. 실시간으로 장소를 모으고 일정을 짜보세요.",
};

export default function RootPage() {
  return <LandingView />;
}
