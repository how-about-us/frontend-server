import { BookmarkFoldersView } from "./_components/BookmarkFoldersView";
import { SetSectionMaxWidth } from "@/contexts/SectionWidthContext";

export default function BookmarkPage() {
  return (
    <div>
      <SetSectionMaxWidth value="s1" />
      <BookmarkFoldersView />
    </div>
  );
}
