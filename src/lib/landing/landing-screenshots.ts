/**
 * `public/landing/` — DevTools 등으로 캡처한 PNG를 같은 경로·파일명으로 교체하면 됩니다.
 * 로컬에서 바로 안 바뀌면 dev 서버 재시작 후 강력 새로고침(⌘⇧R).
 */

import { landingAssetDir } from "@/lib/public-assets";

/** `public/landing` 01~04 캡처 공통 픽셀 크기 (여백 포함 원본) */
export const LANDING_SCREENSHOT_PIXEL_SIZE = {
  width: 2920,
  height: 1934,
} as const;

export type LandingScreenshotSpec = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** 05·06 등 — 카드 프레임·축소 표시 */
  framed?: boolean;
  frameMaxWidthClass?: string;
};

/**
 * 랜딩 스크린샷 — 페이지 위→아래 표시 순서.
 * 파일 교체 시 `public/landing/` 아래 번호 접두 파일명을 그대로 덮어쓰면 됩니다.
 */
export const LANDING_SCREENSHOT_ORDER = [
  { order: 1, file: "01-hero-app.png", label: "히어로" },
  { order: 2, file: "02-feature-map.png", label: "지도로 장소 모으기" },
  { order: 3, file: "03-feature-place-share.png", label: "장소를 찾고 공유하기" },
  { order: 4, file: "04-feature-plan.png", label: "날짜별 일정과 동선" },
  { order: 5, file: "05-feature-chat.png", label: "실시간 채팅 협업" },
  { order: 6, file: "06-feature-ai.png", label: "팀이 함께 쓰는 AI" },
] as const;

function landingScreenshotPath(file: (typeof LANDING_SCREENSHOT_ORDER)[number]["file"]) {
  return `${landingAssetDir}/${file}`;
}

export const LANDING_HERO_SCREENSHOT: LandingScreenshotSpec = {
  src: landingScreenshotPath("01-hero-app.png"),
  alt: "우때 앱 화면 — 지도와 일정, 채팅을 함께 사용하는 여행 플래너",
  ...LANDING_SCREENSHOT_PIXEL_SIZE,
};

/** 기능 섹션(480px)보다 크게 — 히어로 2열 그리드 이미지 열 기준 */
export const LANDING_HERO_SCREENSHOT_SIZES =
  "(max-width: 720px) 100vw, min(640px, 58vw)";

export const LANDING_FEATURE_SCREENSHOTS = {
  map: {
    src: landingScreenshotPath("02-feature-map.png"),
    alt: "우때 지도 — 장소 탐색과 북마크",
    ...LANDING_SCREENSHOT_PIXEL_SIZE,
  },
  placeShare: {
    src: landingScreenshotPath("03-feature-place-share.png"),
    alt: "우때 장소 상세 — 채팅으로 보내기와 북마크·일정 공유",
    ...LANDING_SCREENSHOT_PIXEL_SIZE,
  },
  plan: {
    src: landingScreenshotPath("04-feature-plan.png"),
    alt: "우때 일정 — 날짜별 여행 계획과 이동 경로",
    ...LANDING_SCREENSHOT_PIXEL_SIZE,
  },
  chat: {
    src: landingScreenshotPath("05-feature-chat.png"),
    alt: "우때 실시간 채팅 — 장소 공유와 AI 추천",
    width: 902,
    height: 1596,
    framed: true,
    frameMaxWidthClass: "max-w-[220px] landing-sm:max-w-[240px]",
  },
  ai: {
    src: landingScreenshotPath("06-feature-ai.png"),
    alt: "우때 AI WOORI — 팀과 함께 보는 장소 추천과 대화 요약",
    width: 902,
    height: 1604,
    framed: true,
    frameMaxWidthClass: "max-w-[220px] landing-sm:max-w-[240px]",
  },
} as const satisfies Record<string, LandingScreenshotSpec>;

export type LandingFeatureScreenshotKey = keyof typeof LANDING_FEATURE_SCREENSHOTS;

export const LANDING_FRAMED_SCREENSHOT_SIZES =
  "(max-width: 720px) 40vw, 240px";
