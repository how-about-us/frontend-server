import { HeaderBar, LeftSection, Map } from "@/components/ui/index";
import { SideBar } from "@/components/ui/SideBar";
import { SectionWidthProvider } from "@/contexts/SectionWidthContext";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SectionWidthProvider>
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

          <section className="hidden h-full min-w-[400px] flex-1 border-l border-gray-border md:flex">
            <Map />
          </section>
        </div>
      </main>
    </SectionWidthProvider>
  );
}
