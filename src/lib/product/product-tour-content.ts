import type { LandingFeatureScreenshotKey } from "@/lib/landing/landing-screenshots";

export type ProductTourStep = {
  id: string;
  index: string;
  eyebrow: string;
  title: string;
  description: string;
  points: readonly string[];
  screenshotKey: LandingFeatureScreenshotKey;
  layout: "wide" | "framed";
  screenContext: "현재 운영 중인 우때 서비스의 실제 화면";
};

export const PRODUCT_TOUR_FLOW = [
  "방 생성",
  "장소 탐색",
  "장소 공유와 대화",
  "일정 구성",
  "AI 활용",
] as const;

export const PRODUCT_TOUR_STEPS: readonly ProductTourStep[] = [
  {
    id: "discover",
    index: "01",
    eyebrow: "DISCOVER",
    title: "지도에서 여행 장소를 함께 찾습니다",
    description:
      "카테고리와 조건으로 후보 장소를 탐색하고 팀 북마크에 모아 비교합니다.",
    points: ["카테고리별 탐색", "조건별 필터", "팀 북마크"],
    screenshotKey: "map",
    layout: "wide",
    screenContext: "현재 운영 중인 우때 서비스의 실제 화면",
  },
  {
    id: "share",
    index: "02",
    eyebrow: "SHARE",
    title: "찾은 장소를 대화와 일정으로 연결합니다",
    description:
      "사진, 평점, 주소가 담긴 장소 카드를 공유하고 북마크나 일정에 바로 추가합니다.",
    points: ["장소 상세 확인", "채팅으로 공유", "일정에 추가"],
    screenshotKey: "placeShare",
    layout: "wide",
    screenContext: "현재 운영 중인 우때 서비스의 실제 화면",
  },
  {
    id: "chat",
    index: "03",
    eyebrow: "CHAT",
    title: "같은 여행방에서 실시간으로 의논합니다",
    description:
      "장소 카드를 보며 의견을 나누고 흩어진 메신저 없이 계획을 이어갑니다.",
    points: ["실시간 대화", "장소 카드 공유", "팀 단위 협업"],
    screenshotKey: "chat",
    layout: "framed",
    screenContext: "현재 운영 중인 우때 서비스의 실제 화면",
  },
  {
    id: "plan",
    index: "04",
    eyebrow: "PLAN",
    title: "날짜별 일정과 이동 동선을 완성합니다",
    description:
      "체류 시간과 메모를 정리하고 순서를 조정하며 지도에서 이동 경로를 확인합니다.",
    points: ["날짜와 시간", "드래그 순서 조정", "지도 이동 경로"],
    screenshotKey: "plan",
    layout: "wide",
    screenContext: "현재 운영 중인 우때 서비스의 실제 화면",
  },
  {
    id: "ai",
    index: "05",
    eyebrow: "WOORI AI",
    title: "여행 맥락을 이해하는 AI를 함께 활용합니다",
    description:
      "팀 대화에 맞는 장소 추천을 받고 길어진 대화의 핵심을 요약해 확인합니다.",
    points: ["맥락 기반 추천", "대화 요약", "팀과 결과 공유"],
    screenshotKey: "ai",
    layout: "framed",
    screenContext: "현재 운영 중인 우때 서비스의 실제 화면",
  },
];
