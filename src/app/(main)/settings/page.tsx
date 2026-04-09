import { SetSectionMaxWidth } from "@/contexts/SectionWidthContext";

export default function SettingsPage() {
  return (
    <div className="rounded-2xl border border-gray-border bg-white p-4">
      <SetSectionMaxWidth value="400px" />
      <p className="text-sm leading-6 text-dark-gray">
        설정 탭입니다. 알림, 계정, 화면 옵션 같은 사용자 설정 컨텐츠를 이 영역에
        연결하면 됩니다.
      </p>
    </div>
  );
}
