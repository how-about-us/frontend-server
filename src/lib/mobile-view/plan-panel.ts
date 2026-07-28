export type MobilePlanPanel = "schedule" | "map" | "chat";

export const MOBILE_PLAN_PANEL_ORDER: readonly MobilePlanPanel[] = [
  "chat",
  "schedule",
  "map",
] as const;

export function readMobilePlanPanel(value: string | null): MobilePlanPanel {
  return value === "map" || value === "chat" ? value : "schedule";
}

export function buildMobilePlanPanelHref(
  pathname: string,
  panel: MobilePlanPanel,
): string {
  const planPath =
    pathname === "/plan" || pathname.startsWith("/plan/")
      ? pathname
      : "/plan";

  return panel === "schedule" ? planPath : `${planPath}?view=${panel}`;
}
