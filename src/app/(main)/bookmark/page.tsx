import { BookmarkFoldersView } from "./_components/BookmarkFoldersView";
import { MainPageHeader } from "@/components/layout/MainPageHeader";
import { SetSectionMaxWidth } from "@/contexts/SectionWidthContext";

export default function BookmarkPage() {
  return (
    <div className="flex flex-col gap-2.5">
      <SetSectionMaxWidth value="s1" />
      <MainPageHeader title="북마크" />
      <BookmarkFoldersView />
    </div>
  );
}
