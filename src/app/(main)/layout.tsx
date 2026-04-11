import { GoogleMapsProvider } from "@/components/googleMap";
import { HeaderBar, LeftSection, SideBar } from "@/components/layout";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { MapWithDetailPanel } from "@/components/map";
import { SectionWidthProvider } from "@/contexts/SectionWidthContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { SelectedPlaceProvider } from "@/contexts/SelectedPlaceContext";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GoogleMapsProvider>
    <SectionWidthProvider>
    <ChatProvider>
    <SelectedPlaceProvider>
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
    </SelectedPlaceProvider>
    </ChatProvider>
    </SectionWidthProvider>
    </GoogleMapsProvider>
  );
}
