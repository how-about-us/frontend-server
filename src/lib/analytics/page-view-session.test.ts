import { describe, expect, it } from "vitest";

import { buildSessionPageViewPlan } from "@/lib/analytics/page-view-session";

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
