import { SetSectionMaxWidth } from "@/contexts/SectionWidthContext";

export default function SearchPage() {
  return (
    <div className="rounded-2xl border border-gray-border bg-white p-4">
      <SetSectionMaxWidth value="400px" />
      <p className="text-sm leading-6 text-dark-gray">
        검색 탭입니다. 장소/일정 키워드 검색 결과를 이 영역에 표시하면 됩니다.
      </p>
    </div>
  );
}
