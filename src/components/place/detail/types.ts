export const TABS = ["홈", "리뷰", "사진"] as const;
export type Tab = (typeof TABS)[number];

export type PlaceReview = {
  rating: number;
  text: string;
  authorDisplayName: string;
  publishTime: string;
  relativePublishTimeDescription: string;
};

export type PlaceDetailResult = {
  photoUrls: string[];
  /** 첫 번째 사진 리소스 이름 — 채팅 장소 공유(STOMP) 페이로드용 */
  photoName: string;
  formattedAddress: string;
  location: { lat: number; lng: number };
  phone: string;
  websiteUri: string;
  googleMapsUri: string;
  openNow: boolean | null;
  weekdayDescriptions: string[];
  userRatingCount: number | null;
  reviewSummary: string | null;
  reviews: PlaceReview[];
};
