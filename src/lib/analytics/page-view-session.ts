import {
  buildAnalyticsPageView,
  type AnalyticsPageViewInput,
  type AnalyticsPageViewParams,
} from "@/lib/analytics/context";

export type SessionUserQueryStatus = "error" | "pending" | "success";

export type SessionPageViewPlanInput = AnalyticsPageViewInput & {
  lastTrackedPathname: string | null;
  queryStatus: SessionUserQueryStatus;
  sessionReady: boolean;
  skipSessionReconciliation: boolean;
  userId: number | undefined;
};

export type SessionPageViewPlan = {
  pageView: AnalyticsPageViewParams | null;
  userId: number | null;
};

export function buildSessionPageViewPlan({
  lastTrackedPathname,
  queryStatus,
  sessionReady,
  skipSessionReconciliation,
  userId,
  ...pageViewInput
}: SessionPageViewPlanInput): SessionPageViewPlan | null {
  if (
    !skipSessionReconciliation &&
    (!sessionReady || queryStatus === "pending")
  ) {
    return null;
  }

  return {
    userId:
      !skipSessionReconciliation && queryStatus === "success"
        ? (userId ?? null)
        : null,
    pageView:
      lastTrackedPathname === pageViewInput.pathname
        ? null
        : buildAnalyticsPageView(pageViewInput),
  };
}
