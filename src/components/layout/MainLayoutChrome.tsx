"use client";

import type { ReactNode } from "react";

import { useMobileView } from "@/contexts/MobileViewContext";
import { useMainMobileRouteRedirect } from "@/hooks/useMobileRedirects";
import { ChatPanel } from "@/components/chat";
import { MapWithDetailPanel } from "@/components/map";

import HeaderBar from "./HeaderBar";
import LeftSection from "./LeftSection";
import { MainContentScrollArea } from "./MainContentScrollArea";
import SideBar from "./SideBar";

export function MainLayoutChrome({ children }: { children: ReactNode }) {
  const { isMobileDevice } = useMobileView();
  useMainMobileRouteRedirect();

  return (
    <main className="h-screen">
      <div className="relative mx-auto flex h-full w-full overflow-hidden rounded-none bg-white">
        <LeftSection>
          <HeaderBar />
          <section className="flex h-full w-full min-w-0 overflow-hidden">
            {!isMobileDevice ? <SideBar /> : null}
            <MainContentScrollArea>{children}</MainContentScrollArea>
          </section>
        </LeftSection>

        {!isMobileDevice ? <MapWithDetailPanel /> : null}
        {!isMobileDevice ? <ChatPanel /> : null}
      </div>
    </main>
  );
}
