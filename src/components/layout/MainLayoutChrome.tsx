"use client";

import type { ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { useMobileView } from "@/contexts/MobileViewContext";
import { useMainMobileRouteRedirect } from "@/hooks/useMobileRedirects";
import { readMobilePlanPanel } from "@/lib/mobile-view";
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useMainMobileRouteRedirect();

  const isPlanRoute = pathname === "/plan" || pathname.startsWith("/plan/");
  const mobilePlanPanel =
    isMobileDevice && isPlanRoute
      ? readMobilePlanPanel(searchParams.get("view"))
      : "schedule";
  const showMobilePlanSurface =
    isMobileDevice && isPlanRoute && mobilePlanPanel !== "schedule";

  return (
    <main className="flex h-screen flex-col">
      <MobileReadOnlyNotice />
      <div className="relative mx-auto flex min-h-0 flex-1 w-full overflow-hidden rounded-none bg-white">
        <LeftSection>
          <HeaderBar />
          <MobileMainTabs />
          <section className="flex min-h-0 w-full min-w-0 flex-1 overflow-hidden">
            {!isMobileDevice ? <SideBar /> : null}
            <MainContentScrollArea fill={showMobilePlanSurface}>
              {showMobilePlanSurface ? (
                mobilePlanPanel === "map" ? (
                  <MapWithDetailPanel mobileInline />
                ) : (
                  <ChatPanel mobileInline />
                )
              ) : (
                children
              )}
            </MainContentScrollArea>
          </section>
        </LeftSection>

        {!isMobileDevice ? <MapWithDetailPanel /> : null}
        {!isMobileDevice ? <ChatPanel /> : null}
        {!isMobileDevice ? <SidebarTutorial /> : null}
      </div>
    </main>
  );
}
