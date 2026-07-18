"use client";

import type { ReactNode } from "react";

import { useMobileView } from "@/contexts/MobileViewContext";
import { useMainMobileRouteRedirect } from "@/hooks/useMobileRedirects";
import { ChatPanel } from "@/components/chat";
import { MapWithDetailPanel } from "@/components/map";

import { MobileMainTabs } from "@/components/mobile/MobileMainTabs";
import { MobileReadOnlyNotice } from "@/components/mobile/MobileReadOnlyNotice";

import HeaderBar from "./HeaderBar";
import LeftSection from "./LeftSection";
import { MainContentScrollArea } from "./MainContentScrollArea";
import SideBar from "./SideBar";
import { SidebarTutorial } from "./SidebarTutorial";

export function MainLayoutChrome({ children }: { children: ReactNode }) {
  const { isMobileDevice } = useMobileView();
  useMainMobileRouteRedirect();

  return (
    <main className="flex h-screen flex-col">
      <MobileReadOnlyNotice />
      <div className="relative mx-auto flex min-h-0 flex-1 w-full overflow-hidden rounded-none bg-white">
        <LeftSection>
          <HeaderBar />
          <MobileMainTabs />
          <section className="flex min-h-0 w-full min-w-0 flex-1 overflow-hidden">
            {!isMobileDevice ? <SideBar /> : null}
            <MainContentScrollArea>{children}</MainContentScrollArea>
          </section>
        </LeftSection>

        {!isMobileDevice ? <MapWithDetailPanel /> : null}
        {!isMobileDevice ? <ChatPanel /> : null}
        {!isMobileDevice ? <SidebarTutorial /> : null}
      </div>
    </main>
  );
}
