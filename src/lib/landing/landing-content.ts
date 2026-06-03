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

export type LandingOnboardingStep = {
  step: number;
  title: string;
  description: string;
};

export const LANDING_FEATURE_CHIPS: readonly LandingFeatureChip[] = [
  {
    icon: MessageCircle,
    title: "실시간 채팅",
    description: "친구들과 대화하며 장소를 공유해요.",
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
    description: "날짜마다 일정을 짜고 메모를 남겨요.",
  },
  {
    icon: Route,
    title: "이동 경로",
    description: "이동수단과 지도 경로를 확인해요.",
  },
];

export const LANDING_SPLIT_SECTIONS: readonly LandingSplitSection[] = [
  {
    id: "chat",
    screenshotKey: "chat",
    title: "실시간 채팅 협업",
    description:
      "여행 멤버와 같은 채팅방에서 장소를 공유하고, \nAI 추천까지 받으며 계획을 세워보세요.",
    points: [
      "접속 중인 멤버를 바로 확인",
      "메시지와 장소 카드가 즉시 반영",
      "채팅에서 바로 장소 카드 공유",
    ],
    reverse: false,
    background: "white",
  },
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
    id: "plan",
    screenshotKey: "plan",
    title: "날짜별 일정과 동선",
    description:
      "날짜별로 일정을 구성하고, 이동 경로까지 확인하며 완성도 높은 여행을 준비하세요.",
    points: [
      "날짜·시간·메모로 일정 구성",
      "드래그로 순서를 쉽게 조정",
      "이동수단과 지도 경로 확인",
    ],
    reverse: false,
    background: "white",
  },
  {
    id: "ai",
    screenshotKey: "ai",
    eyebrow: "WOORI",
    title: "팀이 함께 쓰는 AI",
    description:
      "장소 추천과 대화 요약을 모두가 같은 창에서 확인하세요.\n혼자 쓰는 AI가 아니라, 여행 멤버 전원이 함께 보는 AI 어시스턴트예요.",
    points: [
      "채팅 맥락을 반영한 장소 추천",
      "긴 대화를 요약해 빠르게 파악",
      "팀원 모두 같은 AI 답변 확인",
    ],
    reverse: false,
    background: "white",
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
