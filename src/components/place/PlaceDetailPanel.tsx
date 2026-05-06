"use client";

import { ArrowLeft, X } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { useChat } from "@/contexts/ChatContext";
import { useChatActions } from "@/hooks/useChatActions";

import type { SearchResultCardProps } from "./SearchResultCard";
import { AddToBookmarkModal } from "./AddToBookmarkModal";
import { AddToScheduleModal } from "./AddToScheduleModal";
import { TABS, type Tab } from "./detail/types";
import { usePlaceDetailData } from "./detail/usePlaceDetailData";
import { HeroSkeleton, HeroGrid } from "./detail/HeroSection";
import { PlaceSummaryHeader } from "./detail/PlaceSummaryHeader";
import { HomeTab } from "./detail/HomeTab";
import { ReviewsTab } from "./detail/ReviewsTab";
import { PhotosTab } from "./detail/PhotosTab";

type PlaceDetailPanelProps = SearchResultCardProps & {
  onClose: () => void;
};

export function PlaceDetailPanel({
  name,
  category,
  reviewSummary: propReviewSummary,
  rating,
  userRatingCount: propUserRatingCount,
  isOpen: propIsOpen,
  image,
  address,
  location,
  googlePlaceId,
  onClose,
}: PlaceDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("홈");
  const [bookmarkModalOpen, setBookmarkModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  const { sendPlaceMessage, canSend } = useChatActions();
  const { openChat } = useChat();

  const { data: detailData, isLoading: isDetailLoading } =
    usePlaceDetailData(googlePlaceId);

  const handleSendToChat = useCallback(() => {
    if (!googlePlaceId?.trim()) {
      toast.error("장소 정보를 확인할 수 없어요.");
      return;
    }
    if (!canSend) {
      toast.error("채팅 연결을 확인해주세요.");
      return;
    }
    const loc = location ?? detailData?.location;
    if (!loc) {
      toast.error("위치 정보가 없어 채팅으로 보낼 수 없어요.");
      return;
    }
    sendPlaceMessage({
      googlePlaceId: googlePlaceId.trim(),
      name,
      formattedAddress: address ?? detailData?.formattedAddress ?? "",
      latitude: loc.lat,
      longitude: loc.lng,
      photoName: detailData?.photoName ?? "",
      rating: rating ?? 0,
    });
    toast.success("장소를 채팅으로 보냈어요");
    openChat();
  }, [
    address,
    canSend,
    detailData?.formattedAddress,
    detailData?.location,
    detailData?.photoName,
    googlePlaceId,
    location,
    name,
    openChat,
    rating,
    sendPlaceMessage,
  ]);

  const phone = detailData?.phone;
  const website = detailData?.websiteUri;
  const hours = detailData?.weekdayDescriptions?.join("\n");
  const photoUrls = detailData?.photoUrls ?? [];
  const openNow = detailData?.openNow ?? propIsOpen;
  const userRatingCount = detailData?.userRatingCount ?? propUserRatingCount;
  const reviewSummary = detailData?.reviewSummary ?? propReviewSummary;
  const reviews = detailData?.reviews ?? [];

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-white">
      {/* Hero – click to jump to 사진 tab */}
      <div
        className="relative h-[185px] shrink-0 cursor-pointer"
        onClick={() => setActiveTab("사진")}
      >
        {isDetailLoading && googlePlaceId ? (
          <HeroSkeleton />
        ) : (
          <HeroGrid photoUrls={photoUrls} fallbackImage={image} name={name} />
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="뒤로가기"
          className="absolute left-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/65"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="닫기"
          className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/65"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable] [scrollbar-color:rgba(0,0,0,0.15)_transparent] [&::-webkit-scrollbar]:w-4 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/[0.15] [&::-webkit-scrollbar-track]:border-l [&::-webkit-scrollbar-track]:border-gray-200 [&::-webkit-scrollbar-track]:bg-transparent">
        <PlaceSummaryHeader
          name={name}
          category={category}
          rating={rating}
          userRatingCount={userRatingCount}
          onSendToChat={googlePlaceId ? handleSendToChat : undefined}
          sendToChatDisabled={
            !googlePlaceId ||
            (!location && !detailData?.location && isDetailLoading)
          }
          onAddToSchedule={
            googlePlaceId
              ? () => setScheduleModalOpen(true)
              : undefined
          }
          addToScheduleDisabled={!googlePlaceId}
          onAddBookmark={
            googlePlaceId
              ? () => setBookmarkModalOpen(true)
              : undefined
          }
          addBookmarkDisabled={!googlePlaceId}
        />

        {/* Tab navigation */}
        <div className="flex shrink-0 border-b border-gray-border">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-[11px] font-medium transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-brand-red text-brand-red"
                  : "text-dark-gray hover:text-[#364153]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "홈" && (
          <HomeTab
            isOpen={openNow}
            address={address}
            phone={phone}
            hours={hours}
            website={website}
            reviewSummary={reviewSummary}
          />
        )}
        {activeTab === "리뷰" && (
          <ReviewsTab
            rating={rating}
            userRatingCount={userRatingCount}
            reviews={reviews}
          />
        )}
        {activeTab === "사진" && (
          <PhotosTab
            photoUrls={photoUrls}
            isLoading={isDetailLoading && !!googlePlaceId}
            fallbackImage={image}
          />
        )}
      </div>

      {scheduleModalOpen && googlePlaceId && (
        <AddToScheduleModal
          googlePlaceId={googlePlaceId}
          onClose={() => setScheduleModalOpen(false)}
        />
      )}

      {bookmarkModalOpen && googlePlaceId && (
        <AddToBookmarkModal
          googlePlaceId={googlePlaceId}
          onClose={() => setBookmarkModalOpen(false)}
        />
      )}
    </div>
  );
}
