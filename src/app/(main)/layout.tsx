import { HeaderBar } from "@/components/ui/index";
import { Map } from "@/components/ui/index";
import { SideBar } from "@/components/ui/SideBar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="h-screen">
      <div className="relative mx-auto flex h-full w-full overflow-hidden rounded-none bg-white">
        <section className="relative flex flex-col flex-1 min-w-[320px] max-w-[720px]">
          <HeaderBar />
          <section className="flex w-full h-full overflow-hidden">
            <SideBar />
            <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
          </section>
        </section>

        <section className="hidden md:flex h-full min-w-[400px] flex-1 border-l border-gray-border">
          <Map />
        </section>
      </div>
    </main>
  );
}
