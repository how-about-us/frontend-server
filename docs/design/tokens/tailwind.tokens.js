// Figma 디자인 시스템 자동 추출 — tailwind.config.js 의 theme.extend 에 병합
module.exports = {
  colors: {
    gray: {
      50: "var(--gray-50)",
      100: "var(--gray-100)",
      200: "var(--gray-200)",
      300: "var(--gray-300)",
      400: "var(--gray-400)",
      500: "var(--gray-500)",
      600: "var(--gray-600)",
      700: "var(--gray-700)",
      800: "var(--gray-800)",
      900: "var(--gray-900)",
      950: "var(--gray-950)",
    },
    blue: {
      50: "var(--blue-50)",
      100: "var(--blue-100)",
      200: "var(--blue-200)",
      300: "var(--blue-300)",
      400: "var(--blue-400)",
      500: "var(--blue-500)",
      600: "var(--blue-600)",
      700: "var(--blue-700)",
      800: "var(--blue-800)",
      900: "var(--blue-900)",
      950: "var(--blue-950)",
    },
    lime: {
      50: "var(--lime-50)",
      100: "var(--lime-100)",
      200: "var(--lime-200)",
      300: "var(--lime-300)",
      400: "var(--lime-400)",
      500: "var(--lime-500)",
      600: "var(--lime-600)",
      700: "var(--lime-700)",
      800: "var(--lime-800)",
      900: "var(--lime-900)",
      950: "var(--lime-950)",
    },
    green: {
      50: "var(--green-50)",
      100: "var(--green-100)",
      200: "var(--green-200)",
      300: "var(--green-300)",
      400: "var(--green-400)",
      500: "var(--green-500)",
      600: "var(--green-600)",
      700: "var(--green-700)",
      800: "var(--green-800)",
      900: "var(--green-900)",
      950: "var(--green-950)",
    },
    red: {
      50: "var(--red-50)",
      100: "var(--red-100)",
      200: "var(--red-200)",
      300: "var(--red-300)",
      400: "var(--red-400)",
      500: "var(--red-500)",
      600: "var(--red-600)",
      700: "var(--red-700)",
      800: "var(--red-800)",
      900: "var(--red-900)",
      950: "var(--red-950)",
    },
    orange: {
      50: "var(--orange-50)",
      100: "var(--orange-100)",
      200: "var(--orange-200)",
      300: "var(--orange-300)",
      400: "var(--orange-400)",
      500: "var(--orange-500)",
      600: "var(--orange-600)",
      700: "var(--orange-700)",
      800: "var(--orange-800)",
      900: "var(--orange-900)",
      950: "var(--orange-950)",
    },

    primary: {
      DEFAULT: "var(--color-primary-default)",
      strong: "var(--color-primary-strong)",
      subtle: "var(--color-primary-subtle)",
    },
    secondary: {
      DEFAULT: "var(--color-secondary-default)",
      strong: "var(--color-secondary-strong)",
      subtle: "var(--color-secondary-subtle)",
    },
    text: {
      DEFAULT: "var(--color-text-default)",
      disabled: "var(--color-text-disabled)",
      inverse: "var(--color-text-inverse)",
      subtle: "var(--color-text-subtle)",
    },
    icon: {
      DEFAULT: "var(--color-icon-default)",
      disabled: "var(--color-icon-disabled)",
      inverse: "var(--color-icon-inverse)",
      subtle: "var(--color-icon-subtle)",
    },
    fill: {
      DEFAULT: "var(--color-fill-default)",
      strong: "var(--color-fill-strong)",
      subtle: "var(--color-fill-subtle)",
    },
    border: {
      DEFAULT: "var(--color-border-default)",
      hover: "var(--color-border-hover)",
      subtle: "var(--color-border-subtle)",
    },
    background: {
      DEFAULT: "var(--color-background-default)",
      strong: "var(--color-background-strong)",
    },
    status: {
      cautionary: "var(--color-status-cautionary)",
      negative: "var(--color-status-negative)",
      positive: "var(--color-status-positive)",
    },
  },

  fontSize: {
    "display-l": ["48px", { lineHeight: "60px", fontWeight: "700", letterSpacing: "-0.02em" }],  // Hero, 핵심 메시지
    "display-m": ["40px", { lineHeight: "52px", fontWeight: "700", letterSpacing: "-0.02em" }],  // 대형 강조 타이틀
    "heading-l": ["32px", { lineHeight: "42px", fontWeight: "700", letterSpacing: "-0.02em" }],  // 페이지 최상위 제목
    "heading-m": ["28px", { lineHeight: "38px", fontWeight: "700", letterSpacing: "-0.02em" }],  // 페이지·대형 섹션
    "heading-s": ["24px", { lineHeight: "34px", fontWeight: "600", letterSpacing: "-0.02em" }],  // 섹션 제목
    "title-l": ["22px", { lineHeight: "30px", fontWeight: "600", letterSpacing: "-0.02em" }],  // 큰 콘텐츠·모달 제목
    "title-m": ["20px", { lineHeight: "28px", fontWeight: "600", letterSpacing: "-0.02em" }],  // 카드·콘텐츠 제목
    "title-s": ["18px", { lineHeight: "26px", fontWeight: "600", letterSpacing: "-0.02em" }],  // 리스트·컴포넌트 제목
    "body-l-regular": ["18px", { lineHeight: "28px", fontWeight: "400", letterSpacing: "-0.02em" }],  // 큰 본문
    "body-l-emphasis": ["18px", { lineHeight: "28px", fontWeight: "500", letterSpacing: "-0.02em" }],  // 큰 본문 강조
    "body-m-regular": ["16px", { lineHeight: "24px", fontWeight: "400", letterSpacing: "-0.02em" }],  // 기본 본문
    "body-m-emphasis": ["16px", { lineHeight: "24px", fontWeight: "500", letterSpacing: "-0.02em" }],  // 기본 본문 강조
    "body-s-regular": ["14px", { lineHeight: "20px", fontWeight: "400", letterSpacing: "-0.02em" }],  // 보조 본문
    "body-s-emphasis": ["14px", { lineHeight: "20px", fontWeight: "500", letterSpacing: "-0.02em" }],  // 보조 본문 강조
    "body-xs-regular": ["12px", { lineHeight: "16px", fontWeight: "400", letterSpacing: "-0.01em" }],  // 고밀도 보조 텍스트
    "body-xs-emphasis": ["12px", { lineHeight: "16px", fontWeight: "500", letterSpacing: "-0.01em" }],  // 고밀도 보조 강조
    "label-xl-regular": ["18px", { lineHeight: "24px", fontWeight: "500", letterSpacing: "-0.02em" }],  // 큰 버튼·주요 액션
    "label-xl-emphasis": ["18px", { lineHeight: "24px", fontWeight: "700", letterSpacing: "-0.02em" }],  // 큰 버튼·주요 액션 강조
    "label-l-regular": ["16px", { lineHeight: "22px", fontWeight: "500", letterSpacing: "-0.02em" }],  // 큰 버튼·주요 액션
    "label-l-emphasis": ["16px", { lineHeight: "22px", fontWeight: "700", letterSpacing: "-0.02em" }],  // 큰 버튼·주요 액션 강조
    "label-m-regular": ["14px", { lineHeight: "20px", fontWeight: "500", letterSpacing: "-0.02em" }],  // 버튼·탭·필드
    "label-m-emphasis": ["14px", { lineHeight: "20px", fontWeight: "700", letterSpacing: "-0.02em" }],  // 버튼·탭·필드 강조
    "label-s-regular": ["13px", { lineHeight: "18px", fontWeight: "500", letterSpacing: "-0.01em" }],  // 작은 컨트롤
    "label-s-emphasis": ["13px", { lineHeight: "18px", fontWeight: "700", letterSpacing: "-0.01em" }],  // 작은 컨트롤 강조
    "label-xs-regular": ["12px", { lineHeight: "16px", fontWeight: "400", letterSpacing: "-0.01em" }],  // Badge·Chip
    "label-xs-emphasis": ["12px", { lineHeight: "16px", fontWeight: "700", letterSpacing: "-0.01em" }],  // Badge·Chip 강조
    "caption-l-regular": ["13px", { lineHeight: "18px", fontWeight: "500", letterSpacing: "-0.01em" }],  // 설명·메타 정보
    "caption-l-emphasis": ["13px", { lineHeight: "18px", fontWeight: "500", letterSpacing: "-0.01em" }],  // 설명 강조
    "caption-m-regular": ["12px", { lineHeight: "16px", fontWeight: "500", letterSpacing: "0.00em" }],  // 일반 Caption
    "caption-m-emphasis": ["12px", { lineHeight: "16px", fontWeight: "500", letterSpacing: "0.00em" }],  // Caption 강조
    "caption-s-regular": ["11px", { lineHeight: "16px", fontWeight: "500", letterSpacing: "0.00em" }],  // 매우 작은 부가 정보
    "caption-s-emphasis": ["11px", { lineHeight: "16px", fontWeight: "500", letterSpacing: "0.00em" }],  // 부가 정보 강조
  },
};
