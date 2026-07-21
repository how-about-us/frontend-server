import { describe, expect, it } from "vitest";

import {
  buildSessionPageViewPlan,
  executeSessionPageViewPlan,
} from "@/lib/analytics/page-view-session";
import { shouldSkipReconcileClientSession } from "@/lib/auth-session";

const page = {
  origin: "https://uttae.app",
  pathname: "/home",
  referrer: "https://google.com/search",
  title: "홈",
};

describe("buildSessionPageViewPlan", () => {
  it("세션 준비 전에는 전송 계획을 만들지 않는다", () => {
    expect(
      buildSessionPageViewPlan({
        ...page,
        lastTrackedPathname: null,
        queryStatus: "pending",
        sessionReady: false,
        skipSessionReconciliation: false,
        userId: undefined,
      }),
    ).toBeNull();
  });

  it("재조정 시작 시 이전 성공 쿼리가 남아 있어도 전송하지 않는다", () => {
    expect(
      buildSessionPageViewPlan({
        ...page,
        lastTrackedPathname: "/login",
        queryStatus: "success",
        sessionReady: false,
        skipSessionReconciliation: false,
        userId: 42,
      }),
    ).toBeNull();
  });

  it("사용자 쿼리가 대기 중이면 전송 계획을 만들지 않는다", () => {
    expect(
      buildSessionPageViewPlan({
        ...page,
        lastTrackedPathname: null,
        queryStatus: "pending",
        sessionReady: true,
        skipSessionReconciliation: false,
        userId: undefined,
      }),
    ).toBeNull();
  });

  it("인증 사용자는 User-ID와 첫 페이지뷰를 함께 계획한다", () => {
    expect(
      buildSessionPageViewPlan({
        ...page,
        lastTrackedPathname: null,
        queryStatus: "success",
        sessionReady: true,
        skipSessionReconciliation: false,
        userId: 42,
      }),
    ).toEqual({
      userId: 42,
      pageView: {
        page_location: "https://uttae.app/home",
        page_path: "/home",
        page_referrer: "https://google.com/search",
        page_title: "홈",
      },
    });
  });

  it("비로그인 성공 결과는 익명 첫 페이지뷰를 계획한다", () => {
    expect(
      buildSessionPageViewPlan({
        ...page,
        lastTrackedPathname: null,
        queryStatus: "success",
        sessionReady: true,
        skipSessionReconciliation: false,
        userId: undefined,
      }),
    ).toEqual({
      userId: null,
      pageView: expect.objectContaining({ page_path: "/home" }),
    });
  });

  it("사용자 쿼리 오류는 익명 첫 페이지뷰를 계획한다", () => {
    expect(
      buildSessionPageViewPlan({
        ...page,
        lastTrackedPathname: null,
        queryStatus: "error",
        sessionReady: true,
        skipSessionReconciliation: false,
        userId: undefined,
      }),
    ).toEqual({
      userId: null,
      pageView: expect.objectContaining({ page_path: "/home" }),
    });
  });

  it("세션 조정 생략 경로는 즉시 익명 첫 페이지뷰를 계획한다", () => {
    expect(
      buildSessionPageViewPlan({
        ...page,
        pathname: "/login",
        lastTrackedPathname: null,
        queryStatus: "pending",
        sessionReady: false,
        skipSessionReconciliation: true,
        userId: 42,
      }),
    ).toEqual({
      userId: null,
      pageView: expect.objectContaining({ page_path: "/login" }),
    });
  });

  it("동일 경로는 User-ID만 동기화하고 페이지뷰를 중복 계획하지 않는다", () => {
    expect(
      buildSessionPageViewPlan({
        ...page,
        lastTrackedPathname: "/home",
        queryStatus: "success",
        sessionReady: true,
        skipSessionReconciliation: false,
        userId: 84,
      }),
    ).toEqual({ userId: 84, pageView: null });
  });

  it("대기 중 경로 대신 준비 완료 시점의 최신 경로를 계획한다", () => {
    expect(
      buildSessionPageViewPlan({
        ...page,
        pathname: "/plan/123",
        lastTrackedPathname: null,
        queryStatus: "success",
        sessionReady: true,
        skipSessionReconciliation: false,
        userId: 42,
      }),
    ).toEqual({
      userId: 42,
      pageView: expect.objectContaining({ page_path: "/plan/[roomId]" }),
    });
  });
});

describe("shouldSkipReconcileClientSession", () => {
  it.each(["/login", "/login/help", "/auth/callback", "/auth/callback/google"])(
    "%s 경로는 세션 조정을 생략한다",
    (pathname) => {
      expect(shouldSkipReconcileClientSession(pathname)).toBe(true);
    },
  );

  it.each(["/", "/home", "/login-extra", "/auth/callback-extra"])(
    "%s 경로는 세션 조정을 수행한다",
    (pathname) => {
      expect(shouldSkipReconcileClientSession(pathname)).toBe(false);
    },
  );
});

describe("executeSessionPageViewPlan", () => {
  it("User-ID를 먼저 설정한 뒤 페이지뷰를 전송한다", () => {
    const calls: string[] = [];

    executeSessionPageViewPlan(
      {
        userId: 42,
        pageView: {
          page_location: "https://uttae.app/home",
          page_path: "/home",
          page_title: "홈",
        },
      },
      {
        setUserId: () => calls.push("set-user-id"),
        trackPageView: () => calls.push("page-view"),
      },
    );

    expect(calls).toEqual(["set-user-id", "page-view"]);
  });

  it("페이지뷰가 없는 계획은 User-ID만 동기화한다", () => {
    const calls: string[] = [];

    executeSessionPageViewPlan(
      { userId: 84, pageView: null },
      {
        setUserId: () => calls.push("set-user-id"),
        trackPageView: () => calls.push("page-view"),
      },
    );

    expect(calls).toEqual(["set-user-id"]);
  });
});
