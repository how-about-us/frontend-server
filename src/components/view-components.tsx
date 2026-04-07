import type { ReactNode } from "react";

export type ViewMode = "search" | "plan" | "bookmark" | "chat" | "settings";

function PlanView() {
  return (
    <div className="space-y-3">
      <ScheduleCard time="09:00" title="히코네성 산책" detail="도보 15분" />
      <ScheduleCard time="12:30" title="점심 - 오미규 덮밥" detail="예약 완료" />
      <ScheduleCard time="15:00" title="카페 휴식" detail="북마크한 장소" />
    </div>
  );
}

function BookmarkView() {
  return (
    <div className="space-y-3">
      <PlaceCard name="히코네성" tag="관광" />
      <PlaceCard name="유메쿄바시 캐슬로드" tag="거리" />
      <PlaceCard name="라 콜리나 오미하치만" tag="디저트" />
    </div>
  );
}

function SettingsView() {
  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
      <p className="text-sm leading-6 text-dark-gray">
        설정 탭입니다. 알림, 계정, 화면 옵션 같은 사용자 설정 컨텐츠를 이
        영역에 연결하면 됩니다.
      </p>
    </div>
  );
}

function SearchView() {
  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
      <p className="text-sm leading-6 text-dark-gray">
        검색 탭입니다. 장소/일정 키워드 검색 결과를 이 영역에 표시하면 됩니다.
      </p>
    </div>
  );
}

function ChatView() {
  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
      <p className="text-sm leading-6 text-dark-gray">
        우측 지도는 고정되어 있고, 왼쪽 탭 영역만 스크롤되도록 구성했습니다.
        이동 동선 확인 후 장소 탭에서 후보지를 정리하세요.
      </p>
    </div>
  );
}

export const VIEW_COMPONENTS: Record<ViewMode, ReactNode> = {
  plan: <PlanView />,
  bookmark: <BookmarkView />,
  settings: <SettingsView />,
  search: <SearchView />,
  chat: <ChatView />,
};

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
        <span className="rounded-md bg-[#e5e7eb] px-2 py-1 text-xs font-semibold text-dark-gray">
          {time}
        </span>
        <span className="text-xs text-brand-green">{detail}</span>
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
