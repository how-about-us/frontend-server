import { HeaderBar, LeftSection, MainContentScrollArea, SideBar } from "@/components/layout";
import { JoinRequestsPoller } from "@/components/layout/JoinRequestsPoller";
import { MainRoomGate } from "@/components/layout/MainRoomGate";
import { ChatPanel } from "@/components/chat";
import { MapWithDetailPanel } from "@/components/map";
import { MainChromeProviders } from "@/providers/main-providers";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MainChromeProviders>
      <MainRoomGate>
        <JoinRequestsPoller />
        <main className="h-screen">
          <div className="relative mx-auto flex h-full w-full overflow-hidden rounded-none bg-white">
            <LeftSection>
              <HeaderBar />
              <section className="flex h-full w-auto overflow-hidden">
                <SideBar />
                <MainContentScrollArea>{children}</MainContentScrollArea>
              </section>
            </LeftSection>

            <MapWithDetailPanel />

            <ChatPanel />
          </div>
        </main>
      </MainRoomGate>
    </MainChromeProviders>
  );
}
