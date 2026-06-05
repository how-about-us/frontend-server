import {
  Bookmark,
  Bot,
  CalendarDays,
  MapPin,
  MessageCircle,
  Route,
  type LucideIcon,
} from "lucide-react";

import type { LandingFeatureScreenshotKey } from "@/lib/landing/landing-screenshots";

export type LandingFeatureChip = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export type LandingSplitSection = {
  id: string;
  screenshotKey: LandingFeatureScreenshotKey;
  title: string;
  description: string;
  points: readonly string[];
  reverse: boolean;
  background: "white" | "muted";
  eyebrow?: string;
};

export type LandingHighlightSection = {
  id: string;
  screenshotKey: LandingFeatureScreenshotKey;
  title: string;
  description: string;
  points: readonly string[];
  eyebrow?: string;
};

export type LandingOnboardingStep = {
  step: number;
  title: string;
  description: string;
};

export const LANDING_FEATURE_CHIPS: readonly LandingFeatureChip[] = [
  {
    icon: MessageCircle,
    title: "실시간 채팅",
    description: "친구들과 대화하며 계획을 공유해요.",
  },
  {
    icon: MapPin,
    title: "장소 탐색",
    description: "검색과 필터로 장소를 찾고 모아요.",
  },
  {
    icon: Bot,
    title: "AI 추천",
    description: "WOORI가 팀 맞춤 장소를 제안해요.",
  },
  {
    icon: Bookmark,
    title: "북마크",
    description: "함께 고른 장소를 한곳에 모아요.",
  },
  {
    icon: CalendarDays,
    title: "날짜별 일정",
    description: "일차마다 체류시간을 정하고 메모를 남겨요.",
  },
  {
    icon: Route,
    title: "이동 경로",
    description: "이동수단과 지도 경로를 확인해요.",
  },
];

export const LANDING_SPLIT_SECTIONS: readonly LandingSplitSection[] = [
  {
    id: "map",
    screenshotKey: "map",
    title: "지도로 장소 모으기",
    description:
      "지도에서 장소를 찾고 북마크에 모아두세요. \n함께 고른 장소를 한눈에 확인할 수 있어요.",
    points: [
      "카테고리별 장소 탐색",
      "필터로 원하는 조건만 보기",
      "북마크에 모아 팀과 공유",
    ],
    reverse: true,
    background: "white",
  },
  {
    id: "place-share",
    screenshotKey: "placeShare",
    title: "장소를 찾고 공유하기",
    description:
      "지도에서 고른 장소를 상세 패널에서 확인하고,\n채팅·북마크·일정으로 팀과 바로 이어 보내세요.",
    points: [
      "채팅으로 보내기 — 사진·평점·주소가 담긴 장소 카드를 팀 채팅에 공유",
      "북마크에 추가 — 폴더에 모아 팀과 후보 장소를 함께 관리",
      "일정에 추가 — 날짜·순서에 맞춰 여행 일정에 바로 반영",
    ],
    reverse: false,
    background: "white",
  },
  {
    id: "plan",
    screenshotKey: "plan",
    title: "날짜별 일정과 동선",
    description:
      "날짜별로 일정을 구성하고, 이동 경로까지 확인하며 완성도 높은 여행을 준비하세요.",
    points: [
      "날짜·체류 시간·메모로 일정 구성하기",
      "드래그로 순서를 쉽게 조정하기",
      "이동수단과 지도 경로 확인하기",
    ],
    reverse: true,
    background: "white",
  },
];

/** 05·06 — 한 행 좌우 2열 (`LandingHighlightSectionsRow`) */
export const LANDING_HIGHLIGHT_SECTIONS: readonly LandingHighlightSection[] = [
  {
    id: "chat",
    screenshotKey: "chat",
    title: "실시간 채팅 협업",
    description:
      "여행 멤버와 같은 채팅방에서 장소를 공유하고, \n자유롭게 이야기를 나누어보세요.",
    points: ["채팅에서 장소 카드 공유하기", "장소 상세 정보에서 공유하기"],
  },
  {
    id: "ai",
    screenshotKey: "ai",
    eyebrow: "WOORI",
    title: "팀이 함께 쓰는 AI",
    description:
      "AI 어시스턴트도 한명의 참여자예요.\n장소 추천과 대화 요약을 채팅창에서 확인하세요.",
    points: ["채팅 맥락을 반영한 장소 추천", "긴 대화를 요약해 빠르게 파악"],
  },
];

export const LANDING_ONBOARDING_STEPS: readonly LandingOnboardingStep[] = [
  {
    step: 1,
    title: "구글 로그인",
    description: "Google 계정으로 빠르게 시작하세요.",
  },
  {
    step: 2,
    title: "여행 만들기",
    description: "여행 이름과 기간을 정하고 방을 만드세요.",
  },
  {
    step: 3,
    title: "링크로 친구 초대",
    description: "초대 링크를 보내고 승인하면 함께 계획해요.",
  },
];

export const LANDING_FEATURE_SCREENSHOT_SIZES =
  "(max-width: 720px) 100vw, 480px";

export const LANDING_SECTION_PY = "py-16 landing-lg:py-20";
