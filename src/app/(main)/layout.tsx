import { HeaderBar, LeftSection, SideBar } from "@/components/layout";
import { JoinRequestsPoller } from "@/components/layout/JoinRequestsPoller";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { MapWithDetailPanel } from "@/components/map";
import { MainProviders } from "./MainProviders";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MainProviders>
      <JoinRequestsPoller />
      <main className="h-screen">
        <div className="relative mx-auto flex h-full w-full overflow-hidden rounded-none bg-white">
          <LeftSection>
            <HeaderBar />
            <section className="flex h-full w-auto overflow-hidden">
              <SideBar />
              <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-color:rgba(0,0,0,0.2)_transparent] pt-6">
                {children}
              </div>
            </section>
          </LeftSection>

          <MapWithDetailPanel />

          <ChatPanel />
        </div>
      </main>
    </MainProviders>
  );
}
