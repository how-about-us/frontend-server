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
  phone: string;
  websiteUri: string;
  googleMapsUri: string;
  openNow: boolean | null;
  weekdayDescriptions: string[];
  userRatingCount: number | null;
  reviewSummary: string | null;
  reviews: PlaceReview[];
};
