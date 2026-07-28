export const TABS = ["홈", "리뷰"] as const;
export type Tab = (typeof TABS)[number];

export type PlaceReview = {
  rating: number;
  text: string;
  authorDisplayName: string;
  publishTime: string;
  relativePublishTimeDescription: string;
};

export type PlaceDetailResult = {
  name: string;
  primaryTypeDisplayName: string;
  rating: number | null;
  formattedAddress: string;
  location: { lat: number; lng: number };
  phone: string;
  websiteUri: string;
  placeUri: string | null;
  reviewsUri: string | null;
  openNow: boolean | null;
  weekdayDescriptions: string[];
  userRatingCount: number | null;
  reviewSummary: string | null;
  reviews: PlaceReview[];
};
