import type { SearchResultCardProps } from "@/components/SearchResultCard";

export const MOCK_SEARCH_RESULTS: SearchResultCardProps[] = [
  {
    name: "교동두부",
    category: "두부요리",
    description:
      "자연의 맛, 정성의 맛 그 자체 · 가격과 함께 즐기는 건강한 식사",
    rating: 4.5,
    isOpen: false,
    reviewCount: 1693,
    images: [
      "https://picsum.photos/seed/gyodong1/224/284",
      "https://picsum.photos/seed/gyodong2/224/284",
      "https://picsum.photos/seed/gyodong3/224/284",
      "https://picsum.photos/seed/gyodong4/224/284",
    ],
  },
  {
    name: "스시 오마카세",
    category: "일식",
    description: "신선한 재료로 만드는 정통 오마카세 · 특별한 날의 완벽한 선택",
    rating: 4.8,
    isOpen: true,
    reviewCount: 2847,
    images: [
      "https://picsum.photos/seed/sushi1/224/284",
      "https://picsum.photos/seed/sushi2/224/284",
      "https://picsum.photos/seed/sushi3/224/284",
      "https://picsum.photos/seed/sushi4/224/284",
    ],
  },
  {
    name: "파스타 공방",
    category: "양식",
    description:
      "수제 면으로 만드는 정통 이탈리안 · 매일 아침 직접 만드는 생면",
    rating: 4.3,
    isOpen: true,
    reviewCount: 956,
    images: [
      "https://picsum.photos/seed/pasta1/224/284",
      "https://picsum.photos/seed/pasta2/224/284",
      "https://picsum.photos/seed/pasta3/224/284",
      "https://picsum.photos/seed/pasta4/224/284",
    ],
  },
  {
    name: "할머니 순두부",
    category: "한식",
    description: "40년 전통의 깊은 맛 · 정성으로 끓여낸 순두부찌개",
    rating: 4.6,
    isOpen: false,
    reviewCount: 3241,
    images: [
      "https://picsum.photos/seed/sundubu1/224/284",
      "https://picsum.photos/seed/sundubu2/224/284",
      "https://picsum.photos/seed/sundubu3/224/284",
      "https://picsum.photos/seed/sundubu4/224/284",
    ],
  },
];
