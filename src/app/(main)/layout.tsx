import { HeaderBar, LeftSection, SideBar } from "@/components/layout";
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
      <main className="h-screen">
        <div className="relative mx-auto flex h-full w-full overflow-hidden rounded-none bg-white">
          <LeftSection>
            <HeaderBar />
            <section className="flex h-full w-auto overflow-hidden">
              <SideBar />
              <div className="min-h-0 flex-1 overflow-y-auto p-6">
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
