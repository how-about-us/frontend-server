export const TABS = ["홈", "메뉴", "리뷰", "사진"] as const;
export type Tab = (typeof TABS)[number];

export type PlaceDetailResult = {
  photoUrls: string[];
  phone: string;
  websiteUri: string;
  weekdayDescriptions: string[];
  googleMapsUri: string;
};

export const MOCK_REVIEWS = [
  {
    id: 1,
    author: "김지현",
    avatar: "https://i.pravatar.cc/40?img=1",
    rating: 5,
    date: "2주 전",
    text: "음식이 정말 맛있고 직원분들도 친절해요. 분위기도 너무 좋아서 특별한 날에 방문하기 딱 좋은 곳이에요!",
  },
  {
    id: 2,
    author: "이민준",
    avatar: "https://i.pravatar.cc/40?img=2",
    rating: 4,
    date: "1달 전",
    text: "가성비가 좋고 맛도 훌륭합니다. 다만 주말 저녁은 웨이팅이 있을 수 있으니 미리 예약하시길 추천해요.",
  },
  {
    id: 3,
    author: "박수연",
    avatar: "https://i.pravatar.cc/40?img=5",
    rating: 5,
    date: "2달 전",
    text: "재방문 의사 100%입니다. 메뉴 구성도 다양하고 매번 퀄리티가 일정해서 믿고 찾는 곳이에요.",
  },
];
