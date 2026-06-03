/** `public/landing/` — DevTools 등으로 캡처한 PNG를 같은 경로·파일명으로 교체하면 됩니다. */

export type LandingScreenshotSpec = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export const LANDING_HERO_SCREENSHOT: LandingScreenshotSpec = {
  src: "/landing/hero-app.png",
  alt: "우때 앱 화면 — 지도와 일정, 채팅을 함께 사용하는 여행 플래너",
  width: 1440,
  height: 900,
};

export const LANDING_FEATURE_SCREENSHOTS = {
  chat: {
    src: "/landing/feature-chat.png",
    alt: "우때 실시간 채팅 — 장소 공유와 AI 추천",
    width: 960,
    height: 600,
  },
  map: {
    src: "/landing/feature-map.png",
    alt: "우때 지도 — 장소 탐색과 북마크",
    width: 960,
    height: 600,
  },
  plan: {
    src: "/landing/feature-plan.png",
    alt: "우때 일정 — 날짜별 여행 계획과 이동 경로",
    width: 960,
    height: 600,
  },
  ai: {
    src: "/landing/feature-ai.png",
    alt: "우때 AI WOORI — 팀과 함께 보는 장소 추천과 대화 요약",
    width: 960,
    height: 600,
  },
} satisfies Record<string, LandingScreenshotSpec>;

export type LandingFeatureScreenshotKey = keyof typeof LANDING_FEATURE_SCREENSHOTS;
