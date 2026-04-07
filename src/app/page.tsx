"use client";

import { useState } from "react";

type LeftTab = "itinerary" | "places" | "notes";

const sidebarItems = [
  { id: "schedule", label: "일정", icon: "/icons/calendar-days.svg" },
  { id: "bookmark", label: "저장", icon: "/icons/bookmark.svg" },
  { id: "chat", label: "채팅", icon: "/icons/chat.svg" },
  { id: "settings", label: "설정", icon: "/icons/user-cog.svg" },
] as const;

export default function Home() {
  const [activeSidebar, setActiveSidebar] =
    useState<(typeof sidebarItems)[number]["id"]>("schedule");
  const [activeTab, setActiveTab] = useState<LeftTab>("itinerary");

  return (
    <main className="h-screen bg-[#f6f7fb] text-[#101828]">
      <div className="mx-auto flex h-full w-full max-w-[1440px] overflow-hidden rounded-none border border-[#e5e7eb] bg-white">
        <aside className="flex w-24 shrink-0 flex-col items-center gap-3 border-r border-[#e5e7eb] bg-[#f8fafc] px-3 py-5">
          <div className="mb-2 text-xs font-semibold text-[#6a7282]">MENU</div>
          {sidebarItems.map((item) => {
            const isActive = item.id === activeSidebar;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSidebar(item.id)}
                className={`flex w-full flex-col items-center gap-1 rounded-xl px-2 py-3 text-xs transition ${
                  isActive
                    ? "bg-[#f12d33] text-white"
                    : "bg-white text-[#6a7282] hover:bg-[#e5e7eb] hover:text-[#101828]"
                }`}
              >
                <img
                  src={item.icon}
                  alt={`${item.label} 아이콘`}
                  className={`h-5 w-5 ${isActive ? "brightness-0 invert" : ""}`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        <section className="flex min-w-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col border-r border-[#e5e7eb]">
            <header className="border-b border-[#e5e7eb] px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold">히코네 여행</h1>
                  <p className="text-sm text-[#6a7282]">금요일, 4월 3일</p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-[#e5e7eb] px-4 py-2 text-sm text-[#6a7282] hover:bg-[#f8fafc]"
                >
                  더보기
                </button>
              </div>
            </header>

            <div className="border-b border-[#e5e7eb] px-6 py-3">
              <div className="flex items-center gap-2">
                <TabButton
                  active={activeTab === "itinerary"}
                  onClick={() => setActiveTab("itinerary")}
                >
                  일정
                </TabButton>
                <TabButton
                  active={activeTab === "places"}
                  onClick={() => setActiveTab("places")}
                >
                  장소
                </TabButton>
                <TabButton
                  active={activeTab === "notes"}
                  onClick={() => setActiveTab("notes")}
                >
                  메모
                </TabButton>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              {activeTab === "itinerary" && (
                <div className="space-y-3">
                  <ScheduleCard
                    time="09:00"
                    title="히코네성 산책"
                    detail="도보 15분"
                  />
                  <ScheduleCard
                    time="12:30"
                    title="점심 - 오미규 덮밥"
                    detail="예약 완료"
                  />
                  <ScheduleCard
                    time="15:00"
                    title="카페 휴식"
                    detail="북마크한 장소"
                  />
                </div>
              )}

              {activeTab === "places" && (
                <div className="space-y-3">
                  <PlaceCard name="히코네성" tag="관광" />
                  <PlaceCard name="유메쿄바시 캐슬로드" tag="거리" />
                  <PlaceCard name="라 콜리나 오미하치만" tag="디저트" />
                </div>
              )}

              {activeTab === "notes" && (
                <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
                  <p className="text-sm leading-6 text-[#475467]">
                    우측 지도는 고정되어 있고, 왼쪽 탭 영역만 스크롤되도록
                    구성했습니다. 이동 동선 확인 후 장소 탭에서 후보지를
                    정리하세요.
                  </p>
                </div>
              )}
            </div>
          </div>

          <aside className="sticky top-0 h-screen w-[420px] shrink-0 bg-[#f3f4f6]">
            <div className="relative h-full border-l border-[#e5e7eb]">
              <div className="absolute left-4 top-4 z-10 rounded-full bg-white px-3 py-1 text-xs font-medium text-[#6a7282] shadow-sm">
                지도 (고정)
              </div>
              <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#e5e7eb_0%,#cbd5e1_100%)]">
                <div className="rounded-2xl border border-white/70 bg-white/70 px-6 py-4 text-center backdrop-blur">
                  <p className="text-sm font-medium text-[#475467]">
                    Map Placeholder
                  </p>
                  <p className="mt-1 text-xs text-[#6a7282]">
                    실제 지도 SDK 연결 위치
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
        active
          ? "bg-[#03c75a] text-white"
          : "bg-white text-[#6a7282] border border-[#e5e7eb] hover:bg-[#f8fafc]"
      }`}
    >
      {children}
    </button>
  );
}

function ScheduleCard({
  time,
  title,
  detail,
}: {
  time: string;
  title: string;
  detail: string;
}) {
  return (
    <article className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <span className="rounded-md bg-[#e5e7eb] px-2 py-1 text-xs font-semibold text-[#6a7282]">
          {time}
        </span>
        <span className="text-xs text-[#03c75a]">{detail}</span>
      </div>
      <h3 className="mt-3 text-base font-semibold">{title}</h3>
    </article>
  );
}

function PlaceCard({ name, tag }: { name: string; tag: string }) {
  return (
    <article className="flex items-center justify-between rounded-2xl border border-[#e5e7eb] bg-white p-4">
      <h3 className="text-sm font-medium">{name}</h3>
      <span className="rounded-full bg-[#f12d33] px-2 py-1 text-xs text-white">
        {tag}
      </span>
    </article>
  );
}
