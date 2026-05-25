import { MainRoomGate } from "@/components/layout/MainRoomGate";
import { MainLayoutChrome } from "@/components/layout/MainLayoutChrome";
import { MainChromeProviders } from "@/providers/main-providers";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MainChromeProviders>
      <MainRoomGate>
        <MainLayoutChrome>{children}</MainLayoutChrome>
      </MainRoomGate>
    </MainChromeProviders>
  );
}
