"use client";

import {
  ArrowLeft,
  X,
  MapPin,
  Clock,
  Phone,
  Globe,
  Star,
  Bookmark,
  ChevronRight,
  Share2,
} from "lucide-react";
import { useState } from "react";
import type { SearchResultCardProps } from "@/components/SearchResultCard";

type PlaceDetailPanelProps = SearchResultCardProps & {
  onClose: () => void;
};

const TABS = ["홈", "소식", "메뉴", "리뷰", "사진", "정보"] as const;
type Tab = (typeof TABS)[number];

const MOCK_REVIEWS = [
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

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${
            i <= Math.round(rating)
              ? "fill-[#FDC700] text-[#FDC700]"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

function HomeTab({
  isOpen,
  address,
  phone,
  hours,
  website,
  rating,
  reviewCount,
}: Pick<
  SearchResultCardProps,
  "isOpen" | "address" | "phone" | "hours" | "website" | "rating" | "reviewCount"
>) {
  return (
    <div>
      {/* Info section */}
      <div className="border-b border-gray-border px-4 py-3">
        <h3 className="mb-2.5 text-[11px] font-semibold text-[#364153]">
          기본 정보
        </h3>
        <ul className="space-y-3">
          {address && (
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-dark-gray" />
              <span className="text-[11px] leading-relaxed text-[#364153]">
                {address}
              </span>
            </li>
          )}
          {hours && (
            <li className="flex items-start gap-3">
              <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-dark-gray" />
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[11px] font-medium ${
                      isOpen ? "text-brand-green" : "text-[#FF6467]"
                    }`}
                  >
                    {isOpen ? "영업 중" : "영업 종료"}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-dark-gray">
                  {hours}
                </p>
              </div>
            </li>
          )}
          {phone && (
            <li className="flex items-center gap-3">
              <Phone className="h-3.5 w-3.5 shrink-0 text-dark-gray" />
              <a
                href={`tel:${phone}`}
                className="text-[11px] text-[#364153] underline-offset-2 hover:underline"
              >
                {phone}
              </a>
            </li>
          )}
          {website && (
            <li className="flex items-center gap-3">
              <Globe className="h-3.5 w-3.5 shrink-0 text-dark-gray" />
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-[11px] text-[#364153] underline-offset-2 hover:underline"
              >
                {website.replace(/^https?:\/\//, "")}
              </a>
            </li>
          )}
        </ul>
      </div>

      {/* Reviews summary */}
      <div className="border-b border-gray-border px-4 py-3">
        <div className="mb-2.5 flex items-center justify-between">
          <h3 className="text-[11px] font-semibold text-[#364153]">리뷰</h3>
          <button className="flex items-center gap-0.5 text-[11px] text-dark-gray">
            전체보기
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xl font-bold text-[#364153]">{rating}</span>
          <div>
            <StarRow rating={rating} />
            <p className="mt-0.5 text-[10px] text-dark-gray">
              리뷰 {reviewCount.toLocaleString()}개
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {MOCK_REVIEWS.slice(0, 2).map((review) => (
            <div key={review.id} className="flex gap-2.5">
              <img
                src={review.avatar}
                alt={review.author}
                className="h-7 w-7 shrink-0 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-[#364153]">
                    {review.author}
                  </span>
                  <StarRow rating={review.rating} />
                  <span className="ml-auto text-[10px] text-dark-gray">
                    {review.date}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-dark-gray">
                  {review.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewsTab({
  rating,
  reviewCount,
}: Pick<SearchResultCardProps, "rating" | "reviewCount">) {
  return (
    <div className="px-4 py-3">
      <div className="mb-4 flex items-center gap-3">
        <div className="text-center">
          <p className="text-3xl font-bold text-[#364153]">{rating}</p>
          <StarRow rating={rating} />
          <p className="mt-0.5 text-[10px] text-dark-gray">
            {reviewCount.toLocaleString()}개
          </p>
        </div>
        <div className="flex-1">
          {[5, 4, 3, 2, 1].map((star) => {
            const pct =
              star === 5
                ? 60
                : star === 4
                  ? 25
                  : star === 3
                    ? 10
                    : star === 2
                      ? 3
                      : 2;
            return (
              <div key={star} className="flex items-center gap-1.5">
                <span className="w-3 text-right text-[10px] text-dark-gray">
                  {star}
                </span>
                <div className="flex-1 overflow-hidden rounded-full bg-gray-200 h-1.5">
                  <div
                    className="h-full rounded-full bg-[#FDC700]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="space-y-4">
        {MOCK_REVIEWS.map((review) => (
          <div key={review.id} className="flex gap-2.5">
            <img
              src={review.avatar}
              alt={review.author}
              className="h-8 w-8 shrink-0 rounded-full object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-[#364153]">
                  {review.author}
                </span>
                <span className="text-[10px] text-dark-gray">{review.date}</span>
              </div>
              <StarRow rating={review.rating} />
              <p className="mt-1 text-[11px] leading-relaxed text-dark-gray">
                {review.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhotosTab({ images }: Pick<SearchResultCardProps, "images">) {
  const allImages =
    images.length >= 6
      ? images
      : [...images, ...images, ...images].slice(0, 9);
  return (
    <div className="grid grid-cols-3 gap-0.5 p-0.5">
      {allImages.map((src, i) => (
        <div key={i} className="aspect-square overflow-hidden bg-light-gray">
          <img
            src={src}
            alt={`사진 ${i + 1}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}

function InfoTab({
  address,
  phone,
  hours,
  website,
  isOpen,
}: Pick<
  SearchResultCardProps,
  "address" | "phone" | "hours" | "website" | "isOpen"
>) {
  return (
    <div className="px-4 py-3">
      <h3 className="mb-3 text-[11px] font-semibold text-[#364153]">
        상세 정보
      </h3>
      <ul className="space-y-4">
        {address && (
          <li className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-dark-gray" />
            <div>
              <p className="text-[11px] font-medium text-[#364153]">주소</p>
              <p className="mt-0.5 text-[11px] text-dark-gray">{address}</p>
            </div>
          </li>
        )}
        {hours && (
          <li className="flex items-start gap-3">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-dark-gray" />
            <div>
              <p className="text-[11px] font-medium text-[#364153]">
                영업시간{" "}
                <span
                  className={`font-normal ${
                    isOpen ? "text-brand-green" : "text-[#FF6467]"
                  }`}
                >
                  {isOpen ? "· 영업 중" : "· 영업 종료"}
                </span>
              </p>
              <p className="mt-0.5 text-[11px] text-dark-gray">{hours}</p>
            </div>
          </li>
        )}
        {phone && (
          <li className="flex items-start gap-3">
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-dark-gray" />
            <div>
              <p className="text-[11px] font-medium text-[#364153]">전화번호</p>
              <a
                href={`tel:${phone}`}
                className="mt-0.5 text-[11px] text-[#364153] underline-offset-2 hover:underline"
              >
                {phone}
              </a>
            </div>
          </li>
        )}
        {website && (
          <li className="flex items-start gap-3">
            <Globe className="mt-0.5 h-4 w-4 shrink-0 text-dark-gray" />
            <div>
              <p className="text-[11px] font-medium text-[#364153]">웹사이트</p>
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 text-[11px] text-[#364153] underline-offset-2 hover:underline"
              >
                {website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          </li>
        )}
      </ul>
    </div>
  );
}

export function PlaceDetailPanel({
  name,
  category,
  description,
  rating,
  isOpen,
  reviewCount,
  images,
  address,
  phone,
  hours,
  website,
  onClose,
}: PlaceDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("홈");

  const photoGrid =
    images.length >= 3
      ? images
      : [...images, ...images, ...images].slice(0, 3);

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-white">
      {/* Photo grid hero */}
      <div className="relative h-[185px] shrink-0">
        <div className="flex h-full gap-0.5 overflow-hidden">
          {/* Large left image */}
          <div className="w-[62%] overflow-hidden rounded-tl-none">
            <img
              src={photoGrid[0]}
              alt={name}
              className="h-full w-full object-cover"
            />
          </div>
          {/* Two stacked images on right */}
          <div className="flex flex-1 flex-col gap-0.5">
            <div className="flex-1 overflow-hidden">
              <img
                src={photoGrid[1] ?? photoGrid[0]}
                alt={name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="relative flex-1 overflow-hidden">
              <img
                src={photoGrid[2] ?? photoGrid[0]}
                alt={name}
                className="h-full w-full object-cover"
              />
              {images.length > 3 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                  <span className="text-xs font-semibold text-white">
                    +{images.length - 3}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Back / close buttons */}
        <button
          onClick={onClose}
          aria-label="뒤로가기"
          className="absolute left-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/65"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/65"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Header info */}
        <div className="border-b border-gray-border px-4 pb-3.5 pt-3">
          <h2 className="text-[15px] font-bold tracking-tight text-[#364153]">
            {name}
          </h2>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span className="text-[11px] text-dark-gray">{category}</span>
            <span className="text-[11px] text-dark-gray">·</span>
            <span
              className={`text-[11px] font-medium ${
                isOpen ? "text-brand-green" : "text-[#FF6467]"
              }`}
            >
              {isOpen ? "영업 중" : "영업 종료"}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1">
            <Star className="h-3 w-3 fill-[#FDC700] text-[#FDC700]" />
            <span className="text-xs font-semibold text-[#364153]">
              {rating}
            </span>
            <span className="text-[11px] text-dark-gray">
              · 리뷰 {reviewCount.toLocaleString()}개
            </span>
          </div>
          {description && (
            <p className="mt-1.5 text-[11px] leading-relaxed text-dark-gray">
              {description}
            </p>
          )}

          {/* Action buttons */}
          <div className="mt-3 flex gap-2">
            <button className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-brand-red py-2.5 text-xs font-semibold text-white transition hover:bg-red-600 active:bg-red-700">
              <MapPin className="h-3.5 w-3.5" />
              길찾기
            </button>
            <button className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-gray-border py-2.5 text-xs font-semibold text-[#364153] transition hover:bg-gray-50 active:bg-gray-100">
              <Bookmark className="h-3.5 w-3.5" />
              저장
            </button>
            <button className="flex items-center justify-center gap-1.5 rounded-md border border-gray-border px-3 py-2.5 text-xs font-semibold text-[#364153] transition hover:bg-gray-50 active:bg-gray-100">
              <Share2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

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
            isOpen={isOpen}
            address={address}
            phone={phone}
            hours={hours}
            website={website}
            rating={rating}
            reviewCount={reviewCount}
          />
        )}
        {activeTab === "리뷰" && (
          <ReviewsTab rating={rating} reviewCount={reviewCount} />
        )}
        {activeTab === "사진" && <PhotosTab images={images} />}
        {activeTab === "정보" && (
          <InfoTab
            address={address}
            phone={phone}
            hours={hours}
            website={website}
            isOpen={isOpen}
          />
        )}
        {(activeTab === "소식" || activeTab === "메뉴") && (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-center">
            <p className="text-sm font-medium text-[#364153]">
              아직 등록된 {activeTab}이 없어요
            </p>
            <p className="text-[11px] text-dark-gray">
              업체 정보가 업데이트되면 여기에 표시됩니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
