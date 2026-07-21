# GA4 동의 변경·철회 설정 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 로그인 여부와 관계없이 사용자가 GA4 분석 동의를 확인·변경·철회하고, 철회 즉시 User-ID·분석 전송·GA 쿠키가 정리되는 개인정보 설정 화면을 만든다.

**Architecture:** 버전 호환 쿠키 유틸리티 위에 주입 가능한 외부 상태 저장소를 두고 배너와 설정 화면이 같은 스냅샷을 구독한다. GA 클라이언트는 Consent Mode v2의 `default → update → config` 순서를 보장하며, 동의 액션은 철회 부수효과와 상태 저장을 한 경로로 조정한다. UI는 공개 `/privacy-settings` 페이지에 두고 홈 프로필 메뉴와 메인 사이드바에서 접근한다.

**Tech Stack:** Next.js 16 App Router, React 19 `useSyncExternalStore`, TypeScript 5, Vitest 4, Tailwind CSS 4, Google tag Consent Mode v2

## Global Constraints

- 허용 전에는 GA 외부 스크립트와 분석 요청을 실행하지 않는다.
- `ad_storage`, `ad_user_data`, `ad_personalization`은 항상 `denied`다.
- `analytics_storage`만 사용자의 선택에 따라 `granted` 또는 `denied`로 바꾼다.
- 기존 `granted`와 `denied` 쿠키는 유지하고 다음 변경부터 `v1:granted`, `v1:denied`로 쓴다.
- 알 수 없는 쿠키 값과 미래 버전은 `pending`으로 처리한다.
- 철회는 User-ID 초기화, Consent Mode 거부 갱신, 앱 전송 차단, GA 쿠키 삭제 순으로 즉시 적용한다.
- 새 런타임·테스트 의존성을 추가하지 않는다.
- 커밋 메시지는 한국어 Conventional Commits 형식을 사용한다.

---

## File Map

- `src/lib/analytics/consent-cookie.ts`: 버전 호환 동의 쿠키 파싱·저장과 GA 쿠키 삭제
- `src/lib/analytics/consent-cookie.test.ts`: 레거시·v1 호환, 저장 성공 판정, GA 쿠키 삭제 테스트
- `src/lib/analytics/consent-store.ts`: 주입 가능한 동의 외부 저장소와 앱 기본 인스턴스
- `src/lib/analytics/consent-store.test.ts`: 구독, 세션 상태, 저장 실패 동작 테스트
- `src/lib/analytics/consent-actions.ts`: 허용·거부의 부수효과 조정
- `src/lib/analytics/consent-actions.test.ts`: 최초 거부와 철회 실행 순서 테스트
- `src/lib/analytics/client.ts`: Consent Mode v2 명령, 재허용, 페이지뷰 전송 게이트
- `src/lib/analytics/client.test.ts`: 명령 순서·중복 방지·철회·페이지뷰 차단 테스트
- `src/lib/analytics/track.ts`: 공용 저장소 기반 일반 이벤트·User-ID 게이트
- `src/lib/analytics/track.test.ts`: 철회 세션의 일반 이벤트 차단 테스트
- `src/components/analytics/ConsentGatedAnalytics.tsx`: 공용 저장소와 동의 액션 연결
- `src/components/analytics/AnalyticsConsentSettings.tsx`: 설정 화면 상태와 상호작용
- `src/components/analytics/AnalyticsConsentSettings.test.tsx`: 상태별 정적 화면·접근성 테스트
- `src/app/privacy-settings/page.tsx`: 공개 설정 페이지와 메타데이터
- `src/components/analytics/PrivacySettingsLink.tsx`: 공용 설정 링크
- `src/lib/analytics/paths.ts`: 공개 개인정보 설정 경로 상수
- `src/components/analytics/PrivacySettingsLink.test.tsx`: 설정 링크 경로 테스트
- `src/app/home/_components/HomeHeader.tsx`: 프로필 메뉴 진입점
- `src/components/layout/SideBar.tsx`: 메인 사이드바 진입점
- `docs/analytics/ga4-operations.md`: 동의 운영 정책과 배포 검증 절차

---

### Task 1: 버전 호환 동의 쿠키와 GA 쿠키 정리

**Files:**
- Create: `src/lib/analytics/consent-cookie.test.ts`
- Modify: `src/lib/analytics/consent-cookie.ts`

**Interfaces:**
- Produces: `parseAnalyticsConsentCookieValue(raw): AnalyticsConsent`
- Produces: `serializeAnalyticsConsentCookieValue(value): string`
- Produces: `writeAnalyticsConsentCookie(value): boolean`
- Produces: `clearGoogleAnalyticsCookies(): void`
- Consumes: 브라우저 `document.cookie`, `window.location`

- [ ] **Step 1: 버전 호환과 삭제 동작의 실패 테스트 작성**

```ts
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clearGoogleAnalyticsCookies,
  parseAnalyticsConsentCookieValue,
  readAnalyticsConsentCookie,
  serializeAnalyticsConsentCookieValue,
  writeAnalyticsConsentCookie,
} from "@/lib/analytics/consent-cookie";

function installCookieJar(initial: Record<string, string> = {}) {
  const jar = new Map(Object.entries(initial));
  const writes: string[] = [];

  vi.stubGlobal("document", {});
  Object.defineProperty(document, "cookie", {
    configurable: true,
    get: () =>
      [...jar.entries()].map(([name, value]) => `${name}=${value}`).join("; "),
    set: (serialized: string) => {
      writes.push(serialized);
      const [pair = ""] = serialized.split(";");
      const separator = pair.indexOf("=");
      const name = pair.slice(0, separator);
      const value = pair.slice(separator + 1);
      if (serialized.includes("Max-Age=0")) jar.delete(name);
      else jar.set(name, value);
    },
  });
  vi.stubGlobal("window", {
    location: { hostname: "app.example.com", protocol: "https:" },
  });

  return { jar, writes };
}

afterEach(() => vi.unstubAllGlobals());

describe("analytics consent cookie", () => {
  it.each([
    ["granted", "granted"],
    ["denied", "denied"],
    ["v1:granted", "granted"],
    ["v1:denied", "denied"],
    ["v2:granted", null],
    ["unknown", null],
  ])("parses %s", (raw, expected) => {
    expect(parseAnalyticsConsentCookieValue(raw)).toBe(expected);
  });

  it("serializes new choices with the v1 policy version", () => {
    expect(serializeAnalyticsConsentCookieValue("granted")).toBe("v1:granted");
    expect(serializeAnalyticsConsentCookieValue("denied")).toBe("v1:denied");
  });

  it("writes v1 while continuing to read a legacy value", () => {
    const { jar } = installCookieJar({
      uttae_analytics_consent: "granted",
    });

    expect(readAnalyticsConsentCookie()).toBe("granted");
    expect(writeAnalyticsConsentCookie("denied")).toBe(true);
    expect(jar.get("uttae_analytics_consent")).toBe("v1:denied");
  });

  it("expires only GA first-party cookies for host and parent domains", () => {
    const { writes } = installCookieJar({
      _ga: "GA1.1.1.1",
      _ga_TEST: "GS1.1.1",
      session: "keep-me",
    });

    clearGoogleAnalyticsCookies();

    expect(writes.some((value) => value.startsWith("_ga=;"))).toBe(true);
    expect(writes.some((value) => value.startsWith("_ga_TEST=;"))).toBe(true);
    expect(writes.some((value) => value.includes("Domain=.example.com"))).toBe(true);
    expect(writes.some((value) => value.startsWith("session=;"))).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트가 새 API 부재로 실패하는지 확인**

Run: `npm test -- src/lib/analytics/consent-cookie.test.ts`

Expected: FAIL because `parseAnalyticsConsentCookieValue`, `serializeAnalyticsConsentCookieValue`, and `clearGoogleAnalyticsCookies` are not exported and `writeAnalyticsConsentCookie` returns `void`.

- [ ] **Step 3: 버전 파싱·검증 저장·GA 쿠키 만료 구현**

Replace `src/lib/analytics/consent-cookie.ts` with:

```ts
export const ANALYTICS_CONSENT_COOKIE_NAME = "uttae_analytics_consent";
export const ANALYTICS_CONSENT_COOKIE_VERSION = "v1";

const CONSENT_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

export type AnalyticsConsentValue = "granted" | "denied";
export type AnalyticsConsent = AnalyticsConsentValue | null;

export function parseAnalyticsConsentCookieValue(
  raw: string | undefined,
): AnalyticsConsent {
  if (raw === "granted" || raw === "v1:granted") return "granted";
  if (raw === "denied" || raw === "v1:denied") return "denied";
  return null;
}

export function serializeAnalyticsConsentCookieValue(
  value: AnalyticsConsentValue,
): string {
  return `${ANALYTICS_CONSENT_COOKIE_VERSION}:${value}`;
}

export function readAnalyticsConsentCookie(): AnalyticsConsent {
  if (typeof document === "undefined") return null;

  const prefix = `${ANALYTICS_CONSENT_COOKIE_NAME}=`;
  for (const cookie of document.cookie.split(";")) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith(prefix)) {
      return parseAnalyticsConsentCookieValue(trimmed.slice(prefix.length));
    }
  }
  return null;
}

export function writeAnalyticsConsentCookie(
  value: AnalyticsConsentValue,
): boolean {
  if (typeof document === "undefined") return false;

  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = [
    `${ANALYTICS_CONSENT_COOKIE_NAME}=${serializeAnalyticsConsentCookieValue(value)}`,
    `Max-Age=${CONSENT_MAX_AGE_SECONDS}`,
    "Path=/",
    "SameSite=Lax",
    secure,
  ].join("; ");

  return readAnalyticsConsentCookie() === value;
}

function googleAnalyticsCookieNames(cookieHeader: string): string[] {
  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim().split("=")[0] ?? "")
    .filter((name) => name === "_ga" || name.startsWith("_ga_"));
}

function cookieDomainCandidates(hostname: string): string[] {
  const parts = hostname.split(".").filter(Boolean);
  if (parts.length < 2 || /^\d+(\.\d+){3}$/.test(hostname)) return [];
  return parts
    .slice(0, -1)
    .map((_, index) => `.${parts.slice(index).join(".")}`);
}

export function clearGoogleAnalyticsCookies(): void {
  if (typeof document === "undefined") return;

  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";
  const domains = cookieDomainCandidates(hostname);

  for (const name of googleAnalyticsCookieNames(document.cookie)) {
    const base = `${name}=; Max-Age=0; Path=/; SameSite=Lax${secure}`;
    document.cookie = base;
    for (const domain of domains) {
      document.cookie = `${base}; Domain=${domain}`;
    }
  }
}
```

- [ ] **Step 4: 쿠키 테스트 통과 확인**

Run: `npm test -- src/lib/analytics/consent-cookie.test.ts`

Expected: PASS with 9 parameterized and direct cases; no non-GA cookie deletion writes.

- [ ] **Step 5: 첫 구현 단위 커밋**

```bash
git add src/lib/analytics/consent-cookie.ts src/lib/analytics/consent-cookie.test.ts
git commit -m "feat(analytics): 동의 쿠키 버전 관리 추가" -m "- 기존 동의 값을 유지하며 v1 형식으로 저장\n- 철회 시 GA 쿠키를 도메인별로 만료"
```

---

### Task 2: 공용 동의 저장소

**Files:**
- Create: `src/lib/analytics/consent-store.ts`
- Create: `src/lib/analytics/consent-store.test.ts`

**Interfaces:**
- Consumes: Task 1의 `readAnalyticsConsentCookie`, `writeAnalyticsConsentCookie`
- Produces: `createAnalyticsConsentStore(port): AnalyticsConsentStore`
- Produces: singleton `analyticsConsentStore`

- [ ] **Step 1: 저장소 구독과 저장 실패의 실패 테스트 작성**

Create `src/lib/analytics/consent-store.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

import { createAnalyticsConsentStore } from "@/lib/analytics/consent-store";

describe("createAnalyticsConsentStore", () => {
  it("reads persisted state and notifies subscribers after a choice", () => {
    let persisted: "granted" | "denied" | null = "granted";
    const listener = vi.fn();
    const store = createAnalyticsConsentStore({
      read: () => persisted,
      write: (value) => {
        persisted = value;
        return true;
      },
    });
    const unsubscribe = store.subscribe(listener);

    expect(store.getSnapshot()).toBe("granted");
    expect(store.set("denied")).toEqual({ persisted: true, state: "denied" });
    expect(store.getSnapshot()).toBe("denied");
    expect(store.isGranted()).toBe(false);
    expect(listener).toHaveBeenCalledOnce();

    unsubscribe();
  });

  it("keeps the current tab denied when cookie persistence fails", () => {
    const store = createAnalyticsConsentStore({
      read: () => "granted",
      write: () => false,
    });

    expect(store.set("denied")).toEqual({ persisted: false, state: "denied" });
    expect(store.getSnapshot()).toBe("denied");
  });

  it("uses pending for server rendering", () => {
    const store = createAnalyticsConsentStore({
      read: () => "granted",
      write: () => true,
    });
    expect(store.getServerSnapshot()).toBe("pending");
  });
});
```

- [ ] **Step 2: 새 저장소 모듈 부재로 RED 확인**

Run: `npm test -- src/lib/analytics/consent-store.test.ts`

Expected: FAIL because `consent-store.ts` is missing.

- [ ] **Step 3: 주입 가능한 저장소와 앱 기본 인스턴스 구현**

Create `src/lib/analytics/consent-store.ts`:

```ts
import {
  readAnalyticsConsentCookie,
  writeAnalyticsConsentCookie,
  type AnalyticsConsent,
  type AnalyticsConsentValue,
} from "@/lib/analytics/consent-cookie";

export type AnalyticsConsentState = AnalyticsConsentValue | "pending";
export type AnalyticsConsentUpdateResult = {
  persisted: boolean;
  state: AnalyticsConsentValue;
};

type ConsentCookiePort = {
  read: () => AnalyticsConsent;
  write: (value: AnalyticsConsentValue) => boolean;
};

export type AnalyticsConsentStore = {
  getServerSnapshot: () => AnalyticsConsentState;
  getSnapshot: () => AnalyticsConsentState;
  isGranted: () => boolean;
  set: (value: AnalyticsConsentValue) => AnalyticsConsentUpdateResult;
  subscribe: (listener: () => void) => () => void;
};

export function createAnalyticsConsentStore(
  port: ConsentCookiePort,
): AnalyticsConsentStore {
  const listeners = new Set<() => void>();
  let sessionState: AnalyticsConsentValue | null = null;

  const getSnapshot = (): AnalyticsConsentState =>
    sessionState ?? port.read() ?? "pending";

  return {
    getServerSnapshot: () => "pending",
    getSnapshot,
    isGranted: () => getSnapshot() === "granted",
    set: (value) => {
      sessionState = value;
      const persisted = port.write(value);
      listeners.forEach((listener) => listener());
      return { persisted, state: value };
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const analyticsConsentStore = createAnalyticsConsentStore({
  read: readAnalyticsConsentCookie,
  write: writeAnalyticsConsentCookie,
});
```

- [ ] **Step 4: 저장소 테스트만 먼저 통과 확인**

Run: `npm test -- src/lib/analytics/consent-store.test.ts`

Expected: PASS with subscriber notification, failed persistence session override, and server snapshot cases.

- [ ] **Step 5: 저장소 구현 단위 커밋**

```bash
git add src/lib/analytics/consent-store.ts src/lib/analytics/consent-store.test.ts
git commit -m "feat(analytics): 분석 동의 상태 저장소 추가" -m "- 배너와 설정 화면이 공유할 구독형 상태 제공\n- 쿠키 저장 실패에도 현재 탭의 선택 유지"
```

---

### Task 3: Consent Mode v2 명령과 중앙 전송 게이트

**Files:**
- Create: `src/lib/analytics/consent-actions.ts`
- Create: `src/lib/analytics/consent-actions.test.ts`
- Modify: `src/lib/analytics/client.ts`
- Modify: `src/lib/analytics/client.test.ts`
- Modify: `src/lib/analytics/track.ts`
- Modify: `src/lib/analytics/track.test.ts`

**Interfaces:**
- Consumes: Task 2의 `analyticsConsentStore.isGranted()`
- Produces: `buildGoogleAnalyticsConsentState(analyticsStorage)`
- Produces: `revokeGoogleAnalyticsConsent()`
- Produces: `grantAnalyticsConsent()`, `denyAnalyticsConsent()`
- Changes: `initializeGoogleAnalytics()` sends consent default/update before config
- Changes: `trackAnalyticsPageView()` and `trackAnalyticsEvent()` require runtime plus granted consent

- [ ] **Step 1: GA 명령 순서·철회 액션·페이지뷰 차단 실패 테스트 작성**

Create `src/lib/analytics/consent-actions.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { createAnalyticsConsentActions } from "@/lib/analytics/consent-actions";

describe("createAnalyticsConsentActions", () => {
  it("grants through the shared store without revoke side effects", () => {
    const order: string[] = [];
    const actions = createAnalyticsConsentActions({
      clearCookies: () => order.push("clear"),
      revokeGoogleAnalytics: () => order.push("revoke"),
      setConsent: (value) => {
        order.push(`set:${value}`);
        return { persisted: true, state: value };
      },
    });

    expect(actions.grant()).toEqual({ persisted: true, state: "granted" });
    expect(order).toEqual(["set:granted"]);
  });

  it("revokes GA before publishing denied state and clears cookies last", () => {
    const order: string[] = [];
    const actions = createAnalyticsConsentActions({
      clearCookies: () => order.push("clear"),
      revokeGoogleAnalytics: () => order.push("revoke"),
      setConsent: (value) => {
        order.push(`set:${value}`);
        return { persisted: true, state: value };
      },
    });

    expect(actions.deny()).toEqual({ persisted: true, state: "denied" });
    expect(order).toEqual(["revoke", "set:denied", "clear"]);
  });
});
```

Replace `src/lib/analytics/client.test.ts` with:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/analytics/runtime", () => ({
  analyticsRuntime: {
    debugMode: false,
    enabled: true,
    measurementId: "G-TEST123",
  },
}));

async function freshClient(consent: "granted" | "denied") {
  vi.resetModules();
  const dataLayer: unknown[] = [];
  vi.stubGlobal("window", { dataLayer });
  vi.stubGlobal("document", {
    cookie: `uttae_analytics_consent=v1:${consent}`,
  });
  const client = await import("@/lib/analytics/client");
  return { client, dataLayer };
}

afterEach(() => vi.unstubAllGlobals());

describe("buildGoogleAnalyticsConfig", () => {
  it("always disables automatic page views", async () => {
    const { client } = await freshClient("granted");
    expect(client.buildGoogleAnalyticsConfig(false)).toEqual({
      send_page_view: false,
    });
  });

  it("marks explicitly enabled debug traffic", async () => {
    const { client } = await freshClient("granted");
    expect(client.buildGoogleAnalyticsConfig(true)).toEqual({
      debug_mode: true,
      send_page_view: false,
    });
  });
});

describe("Google Consent Mode", () => {
  it("keeps advertising denied for both analytics choices", async () => {
    const { client } = await freshClient("granted");
    expect(client.buildGoogleAnalyticsConsentState("granted")).toEqual({
      ad_personalization: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      analytics_storage: "granted",
    });
    expect(
      client.buildGoogleAnalyticsConsentState("denied").analytics_storage,
    ).toBe("denied");
  });

  it("queues default, granted update, js, and config in order", async () => {
    const { client, dataLayer } = await freshClient("granted");

    client.initializeGoogleAnalytics("G-TEST123", false);

    expect(dataLayer).toEqual([
      [
        "consent",
        "default",
        client.buildGoogleAnalyticsConsentState("denied"),
      ],
      [
        "consent",
        "update",
        client.buildGoogleAnalyticsConsentState("granted"),
      ],
      ["js", expect.any(Date)],
      ["config", "G-TEST123", { send_page_view: false }],
    ]);
  });

  it("clears user id and denies storage, then re-grants without duplicate config", async () => {
    const { client, dataLayer } = await freshClient("granted");
    client.initializeGoogleAnalytics("G-TEST123", false);
    dataLayer.length = 0;

    client.revokeGoogleAnalyticsConsent();
    client.initializeGoogleAnalytics("G-TEST123", false);

    expect(dataLayer).toEqual([
      ["set", { user_id: null }],
      [
        "consent",
        "update",
        client.buildGoogleAnalyticsConsentState("denied"),
      ],
      [
        "consent",
        "update",
        client.buildGoogleAnalyticsConsentState("granted"),
      ],
    ]);
  });

  it("does not create gtag when rejecting before analytics initialization", async () => {
    const { client, dataLayer } = await freshClient("denied");
    client.revokeGoogleAnalyticsConsent();
    expect(dataLayer).toEqual([]);
    expect(window.gtag).toBeUndefined();
  });

  it("blocks page views unless consent is granted", async () => {
    const { client, dataLayer } = await freshClient("denied");
    client.trackAnalyticsPageView({
      page_location: "https://example.com/search",
      page_path: "/search",
      page_referrer: "",
      page_title: "검색",
    });
    expect(dataLayer).toEqual([]);

    document.cookie = "uttae_analytics_consent=v1:granted";
    client.trackAnalyticsPageView({
      page_location: "https://example.com/search",
      page_path: "/search",
      page_referrer: "",
      page_title: "검색",
    });
    expect(dataLayer).toEqual([
      [
        "event",
        "page_view",
        expect.objectContaining({ page_path: "/search" }),
      ],
    ]);
  });
});
```

Add to `src/lib/analytics/track.test.ts`:

```ts
// Add `afterEach` and `vi` to the existing Vitest import.
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("analytics consent gate", () => {
  it("blocks an event after denial and sends it after grant", async () => {
    vi.stubEnv("NEXT_PUBLIC_GA_DEBUG_MODE", "true");
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TEST123");
    vi.stubGlobal("window", { dataLayer: [] as unknown[] });
    vi.stubGlobal("document", {
      cookie: "uttae_analytics_consent=v1:denied",
    });
    vi.resetModules();
    const { AnalyticsEvents, trackAnalyticsEvent } = await import(
      "@/lib/analytics/track"
    );

    trackAnalyticsEvent(AnalyticsEvents.createBookmarkFolder);
    expect(window.dataLayer).toEqual([]);

    document.cookie = "uttae_analytics_consent=v1:granted";
    trackAnalyticsEvent(AnalyticsEvents.createBookmarkFolder);
    expect(window.dataLayer).toEqual([
      ["event", "create_bookmark_folder"],
    ]);
  });
});
```

- [ ] **Step 2: Consent Mode API 부재와 기존 무조건 페이지뷰로 RED 확인**

Run: `npm test -- src/lib/analytics/client.test.ts src/lib/analytics/track.test.ts src/lib/analytics/consent-actions.test.ts`

Expected: FAIL because the consent action module and consent builders/revoke API are missing, page views do not check consent, and the event gate does not share the session-aware store.

- [ ] **Step 3: GA 클라이언트에 Consent Mode와 재허용 구현**

Add these declarations and functions to `src/lib/analytics/client.ts`, and replace `initializeGoogleAnalytics`, `trackAnalyticsPageView` with the shown bodies:

```ts
import { analyticsConsentStore } from "@/lib/analytics/consent-store";
import { analyticsRuntime } from "@/lib/analytics/runtime";

type GoogleConsentValue = "granted" | "denied";
type GoogleAnalyticsConsentState = {
  ad_personalization: "denied";
  ad_storage: "denied";
  ad_user_data: "denied";
  analytics_storage: GoogleConsentValue;
};

let consentDefaultSent = false;

export function buildGoogleAnalyticsConsentState(
  analyticsStorage: GoogleConsentValue,
): GoogleAnalyticsConsentState {
  return {
    ad_personalization: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    analytics_storage: analyticsStorage,
  };
}

export function initializeGoogleAnalytics(
  measurementId: string,
  debugMode: boolean,
): void {
  if (!consentDefaultSent) {
    sendAnalyticsCommand(
      "consent",
      "default",
      buildGoogleAnalyticsConsentState("denied"),
    );
    consentDefaultSent = true;
  }

  sendAnalyticsCommand(
    "consent",
    "update",
    buildGoogleAnalyticsConsentState("granted"),
  );

  const configuration = `${measurementId}:${debugMode}`;
  if (initializedConfiguration === configuration) return;

  sendAnalyticsCommand("js", new Date());
  sendAnalyticsCommand(
    "config",
    measurementId,
    buildGoogleAnalyticsConfig(debugMode),
  );
  initializedConfiguration = configuration;
}

export function revokeGoogleAnalyticsConsent(): void {
  if (
    initializedConfiguration === null ||
    typeof window === "undefined" ||
    typeof window.gtag !== "function"
  ) {
    return;
  }

  sendAnalyticsCommand("set", { user_id: null });
  sendAnalyticsCommand(
    "consent",
    "update",
    buildGoogleAnalyticsConsentState("denied"),
  );
}

export function trackAnalyticsPageView(
  params: AnalyticsPageViewParams,
): void {
  if (!analyticsRuntime.enabled) return;
  if (!analyticsConsentStore.isGranted()) return;
  sendAnalyticsCommand("event", "page_view", params);
}
```

- [ ] **Step 4: 허용·철회 부수효과를 한 액션 모듈로 조정**

Create `src/lib/analytics/consent-actions.ts`:

```ts
import { revokeGoogleAnalyticsConsent } from "@/lib/analytics/client";
import {
  clearGoogleAnalyticsCookies,
  type AnalyticsConsentValue,
} from "@/lib/analytics/consent-cookie";
import {
  analyticsConsentStore,
  type AnalyticsConsentUpdateResult,
} from "@/lib/analytics/consent-store";

type AnalyticsConsentActionDependencies = {
  clearCookies: () => void;
  revokeGoogleAnalytics: () => void;
  setConsent: (
    value: AnalyticsConsentValue,
  ) => AnalyticsConsentUpdateResult;
};

export function createAnalyticsConsentActions(
  dependencies: AnalyticsConsentActionDependencies,
) {
  return {
    grant: () => dependencies.setConsent("granted"),
    deny: () => {
      dependencies.revokeGoogleAnalytics();
      const result = dependencies.setConsent("denied");
      dependencies.clearCookies();
      return result;
    },
  };
}

const analyticsConsentActions = createAnalyticsConsentActions({
  clearCookies: clearGoogleAnalyticsCookies,
  revokeGoogleAnalytics: revokeGoogleAnalyticsConsent,
  setConsent: analyticsConsentStore.set,
});

export const grantAnalyticsConsent = analyticsConsentActions.grant;
export const denyAnalyticsConsent = analyticsConsentActions.deny;
```

- [ ] **Step 5: 일반 이벤트와 User-ID 게이트를 공용 저장소로 교체**

In `src/lib/analytics/track.ts`, replace the cookie import and both direct cookie checks:

```ts
import { analyticsConsentStore } from "@/lib/analytics/consent-store";

export function setAnalyticsUserId(userId: number | null | undefined): void {
  if (!analyticsRuntime.enabled) return;
  if (!analyticsConsentStore.isGranted()) return;

  sendAnalyticsCommand(...buildAnalyticsUserIdCommand(userId));
}

export function trackAnalyticsEvent<EventName extends AnalyticsEventName>(
  eventName: EventName,
  ...args: AnalyticsEventArguments<EventName>
): void {
  const params = args[0];
  if (!analyticsRuntime.enabled) return;
  if (!analyticsConsentStore.isGranted()) return;

  const cleaned = cleanParams(params);
  if (Object.keys(cleaned).length > 0) {
    sendAnalyticsCommand("event", eventName, cleaned);
  } else {
    sendAnalyticsCommand("event", eventName);
  }
}
```

- [ ] **Step 6: Task 2·3 테스트 전체 GREEN 확인**

Run: `npm test -- src/lib/analytics/consent-cookie.test.ts src/lib/analytics/consent-store.test.ts src/lib/analytics/consent-actions.test.ts src/lib/analytics/client.test.ts src/lib/analytics/track.test.ts`

Expected: PASS for versioning, shared state, revoke order, Consent Mode order, no duplicate config, and both delivery gates.

- [ ] **Step 7: Consent Mode와 철회 액션 구현 단위 커밋**

```bash
git add src/lib/analytics/consent-actions.ts src/lib/analytics/consent-actions.test.ts src/lib/analytics/client.ts src/lib/analytics/client.test.ts src/lib/analytics/track.ts src/lib/analytics/track.test.ts
git commit -m "feat(analytics): 분석 동의 철회 흐름 추가" -m "- Consent Mode v2 명령 순서와 재허용 처리\n- 공용 동의 저장소로 이벤트와 페이지뷰 전송 차단"
```

---

### Task 4: 공용 상태를 사용하는 개인정보 설정 화면

**Files:**
- Modify: `src/components/analytics/ConsentGatedAnalytics.tsx`
- Create: `src/components/analytics/AnalyticsConsentSettings.tsx`
- Create: `src/components/analytics/AnalyticsConsentSettings.test.tsx`
- Create: `src/app/privacy-settings/page.tsx`

**Interfaces:**
- Consumes: `analyticsConsentStore`, `grantAnalyticsConsent`, `denyAnalyticsConsent`
- Produces: `AnalyticsConsentSettingsView` for deterministic state rendering tests
- Produces: public route `/privacy-settings`

- [ ] **Step 1: 상태별 설정 카드의 실패 테스트 작성**

Create `src/components/analytics/AnalyticsConsentSettings.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { AnalyticsConsentSettingsView } from "@/components/analytics/AnalyticsConsentSettings";

describe("AnalyticsConsentSettingsView", () => {
  it.each([
    ["pending", "선택 전"],
    ["granted", "분석 쿠키 허용"],
    ["denied", "분석 쿠키 거부"],
  ] as const)("renders %s state accessibly", (consent, label) => {
    const html = renderToStaticMarkup(
      <AnalyticsConsentSettingsView
        consent={consent}
        message=""
        onGrant={vi.fn()}
        onDeny={vi.fn()}
      />,
    );

    expect(html).toContain(label);
    expect(html).toContain('href="/privacy"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain("허용");
    expect(html).toContain("거부");
  });

  it("announces a persistence failure without hiding the selected state", () => {
    const message =
      "선택은 현재 탭에 적용했지만 브라우저에 저장하지 못했습니다.";
    const html = renderToStaticMarkup(
      <AnalyticsConsentSettingsView
        consent="denied"
        message={message}
        onGrant={vi.fn()}
        onDeny={vi.fn()}
      />,
    );

    expect(html).toContain(message);
    expect(html).toContain("분석 쿠키 거부");
  });
});
```

- [ ] **Step 2: 설정 구성요소 부재로 RED 확인**

Run: `npm test -- src/components/analytics/AnalyticsConsentSettings.test.tsx`

Expected: FAIL because `AnalyticsConsentSettings` does not exist.

- [ ] **Step 3: 설정 화면과 즉시 변경 피드백 구현**

Create `src/components/analytics/AnalyticsConsentSettings.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useCallback, useState, useSyncExternalStore } from "react";

import {
  SettingsActionButton,
  SettingsActionButtonRow,
} from "@/components/settings/SettingsActionButton";
import {
  denyAnalyticsConsent,
  grantAnalyticsConsent,
} from "@/lib/analytics/consent-actions";
import {
  analyticsConsentStore,
  type AnalyticsConsentState,
} from "@/lib/analytics/consent-store";
import { AGREEMENT_PUBLIC_PATH } from "@/lib/agreements/paths";

type AnalyticsConsentSettingsViewProps = {
  consent: AnalyticsConsentState;
  message: string;
  onDeny: () => void;
  onGrant: () => void;
};

const consentLabels: Record<AnalyticsConsentState, string> = {
  pending: "선택 전",
  granted: "분석 쿠키 허용",
  denied: "분석 쿠키 거부",
};

export function AnalyticsConsentSettingsView({
  consent,
  message,
  onDeny,
  onGrant,
}: AnalyticsConsentSettingsViewProps) {
  return (
    <section className="mx-auto w-full max-w-2xl rounded-3xl border border-gray-border bg-white p-6 shadow-sm sm:p-8">
      <p className="text-[15px] font-medium text-dark-gray">현재 상태</p>
      <p className="mt-1 text-[22px] font-semibold text-neutral-900">
        {consentLabels[consent]}
      </p>
      <p className="mt-4 text-[17px] leading-relaxed text-dark-gray">
        허용하면 서비스 이용 흐름과 기능 사용 통계를 수집합니다. 거부하거나
        철회하면 Google Analytics 추적을 중단하고 브라우저의 분석 쿠키를
        삭제합니다.
      </p>
      <p className="mt-3 text-[15px] leading-relaxed text-dark-gray">
        자세한 내용은{" "}
        <Link
          href={AGREEMENT_PUBLIC_PATH.PRIVACY_POLICY}
          className="font-medium text-brand-red underline-offset-2 hover:underline"
        >
          개인정보 처리방침
        </Link>
        에서 확인할 수 있습니다.
      </p>
      <SettingsActionButtonRow className="mt-6">
        <SettingsActionButton
          variant="secondary"
          aria-pressed={consent === "denied"}
          onClick={onDeny}
        >
          거부
        </SettingsActionButton>
        <SettingsActionButton
          variant="primary"
          aria-pressed={consent === "granted"}
          onClick={onGrant}
        >
          허용
        </SettingsActionButton>
      </SettingsActionButtonRow>
      <p aria-live="polite" className="mt-4 min-h-6 text-[15px] text-dark-gray">
        {message}
      </p>
    </section>
  );
}

export function AnalyticsConsentSettings() {
  const consent = useSyncExternalStore(
    analyticsConsentStore.subscribe,
    analyticsConsentStore.getSnapshot,
    analyticsConsentStore.getServerSnapshot,
  );
  const [message, setMessage] = useState("");

  const showResult = useCallback(
    (persisted: boolean, granted: boolean) => {
      setMessage(
        persisted
          ? granted
            ? "분석 쿠키를 허용했습니다."
            : "분석 쿠키를 거부했습니다."
          : "선택은 현재 탭에 적용했지만 브라우저에 저장하지 못했습니다. 새로고침 후 다시 선택해 주세요.",
      );
    },
    [],
  );

  return (
    <AnalyticsConsentSettingsView
      consent={consent}
      message={message}
      onGrant={() => showResult(grantAnalyticsConsent().persisted, true)}
      onDeny={() => showResult(denyAnalyticsConsent().persisted, false)}
    />
  );
}
```

Create `src/app/privacy-settings/page.tsx`:

```tsx
import type { Metadata } from "next";

import { AnalyticsConsentSettings } from "@/components/analytics/AnalyticsConsentSettings";
import { PolicyPageShell } from "@/components/agreements/PolicyPageShell";

export const metadata: Metadata = {
  title: "개인정보 설정 — 우때",
  description: "우때 분석 쿠키 허용 및 철회 설정",
};

export default function PrivacySettingsPage() {
  return (
    <PolicyPageShell title="개인정보 설정">
      <AnalyticsConsentSettings />
    </PolicyPageShell>
  );
}
```

- [ ] **Step 4: 배너와 GA 게이트를 공용 저장소·액션으로 교체**

Replace the local listener functions and handlers in `src/components/analytics/ConsentGatedAnalytics.tsx` with:

```tsx
import { useCallback, useSyncExternalStore } from "react";

import {
  denyAnalyticsConsent,
  grantAnalyticsConsent,
} from "@/lib/analytics/consent-actions";
import { analyticsConsentStore } from "@/lib/analytics/consent-store";

export function ConsentGatedAnalytics({
  debugMode,
  gaId,
}: ConsentGatedAnalyticsProps) {
  const consent = useSyncExternalStore(
    analyticsConsentStore.subscribe,
    analyticsConsentStore.getSnapshot,
    analyticsConsentStore.getServerSnapshot,
  );

  const handleAccept = useCallback(() => {
    grantAnalyticsConsent();
  }, []);

  const handleReject = useCallback(() => {
    denyAnalyticsConsent();
  }, []);

  return (
    <>
      {consent === "pending" ? (
        <CookieConsentBanner onAccept={handleAccept} onReject={handleReject} />
      ) : null}
      {consent === "granted" ? (
        <>
          <GoogleAnalyticsScript debugMode={debugMode} gaId={gaId} />
          <AnalyticsRouteTracker />
        </>
      ) : null}
    </>
  );
}
```

- [ ] **Step 5: 설정 화면 테스트와 타입 검사 통과 확인**

Run: `npm test -- src/components/analytics/AnalyticsConsentSettings.test.tsx src/lib/analytics/consent-store.test.ts src/lib/analytics/consent-actions.test.ts`

Expected: PASS with three state labels, privacy policy link, live region, persistence failure text, shared store, and action ordering.

Run: `npx tsc --noEmit`

Expected: PASS; all store callbacks and page exports satisfy React/Next types.

- [ ] **Step 6: 설정 화면 구현 단위 커밋**

```bash
git add src/components/analytics/ConsentGatedAnalytics.tsx src/components/analytics/AnalyticsConsentSettings.tsx src/components/analytics/AnalyticsConsentSettings.test.tsx src/app/privacy-settings/page.tsx
git commit -m "feat(analytics): 개인정보 동의 설정 화면 추가" -m "- 공개 설정 페이지에서 분석 쿠키 허용과 철회 지원\n- 쿠키 배너와 설정 화면이 공용 동의 상태 구독"
```

---

### Task 5: 홈과 메인 앱의 설정 진입점

**Files:**
- Create: `src/lib/analytics/paths.ts`
- Create: `src/components/analytics/PrivacySettingsLink.tsx`
- Create: `src/components/analytics/PrivacySettingsLink.test.tsx`
- Modify: `src/app/home/_components/HomeHeader.tsx`
- Modify: `src/components/layout/SideBar.tsx`

**Interfaces:**
- Produces: `ANALYTICS_CONSENT_SETTINGS_PATH`
- Produces: 스타일과 자식을 받는 `PrivacySettingsLink`

- [ ] **Step 1: 공개 설정 경로 링크 실패 테스트 작성**

Create `src/components/analytics/PrivacySettingsLink.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PrivacySettingsLink } from "@/components/analytics/PrivacySettingsLink";

describe("PrivacySettingsLink", () => {
  it("renders an addressable privacy settings link", () => {
    const html = renderToStaticMarkup(
      <PrivacySettingsLink className="menu-link">
        개인정보 설정
      </PrivacySettingsLink>,
    );

    expect(html).toContain('href="/privacy-settings"');
    expect(html).toContain('class="menu-link"');
    expect(html).toContain("개인정보 설정");
  });
});
```

- [ ] **Step 2: 링크 구성요소 부재로 RED 확인**

Run: `npm test -- src/components/analytics/PrivacySettingsLink.test.tsx`

Expected: FAIL because `PrivacySettingsLink` does not exist.

- [ ] **Step 3: 공용 링크 구현**

Create `src/lib/analytics/paths.ts`:

```ts
export const ANALYTICS_CONSENT_SETTINGS_PATH = "/privacy-settings";
```

Create `src/components/analytics/PrivacySettingsLink.tsx`:

```tsx
import type { ComponentProps } from "react";
import Link from "next/link";

import { ANALYTICS_CONSENT_SETTINGS_PATH } from "@/lib/analytics/paths";

type PrivacySettingsLinkProps = Omit<ComponentProps<typeof Link>, "href">;

export function PrivacySettingsLink(props: PrivacySettingsLinkProps) {
  return <Link href={ANALYTICS_CONSENT_SETTINGS_PATH} {...props} />;
}
```

- [ ] **Step 4: 홈 프로필 메뉴와 사이드바에 링크 배치**

In `src/app/home/_components/HomeHeader.tsx`, import `PrivacySettingsLink` and insert it before the logout button:

```tsx
<PrivacySettingsLink
  onClick={() => setOpen(false)}
  className="block w-full px-4 py-2.5 text-left text-[17px] text-dark-gray transition hover:bg-bubble-gray"
>
  개인정보 설정
</PrivacySettingsLink>
```

In `src/components/layout/SideBar.tsx`, import `ShieldCheck` from `lucide-react`, `PrivacySettingsLink`, and `sidebarNavButtonClassName`. Insert this as the first item in the bottom action group:

```tsx
<PrivacySettingsLink
  className={sidebarNavButtonClassName()}
  aria-label="sidebar-privacy-settings"
>
  <ShieldCheck
    className="h-6 w-6 text-dark-gray"
    strokeWidth={2}
    aria-hidden
  />
</PrivacySettingsLink>
```

- [ ] **Step 5: 링크 테스트와 변경 UI 린트 통과 확인**

Run: `npm test -- src/components/analytics/PrivacySettingsLink.test.tsx src/components/analytics/AnalyticsConsentSettings.test.tsx`

Expected: PASS with `/privacy-settings` href and all settings states.

Run: `npm run lint -- src/components/analytics/PrivacySettingsLink.tsx src/components/analytics/PrivacySettingsLink.test.tsx src/app/home/_components/HomeHeader.tsx src/components/layout/SideBar.tsx`

Expected: PASS with no new ESLint errors or warnings in the four files.

- [ ] **Step 6: 진입점 구현 단위 커밋**

```bash
git add src/lib/analytics/paths.ts src/components/analytics/PrivacySettingsLink.tsx src/components/analytics/PrivacySettingsLink.test.tsx src/app/home/_components/HomeHeader.tsx src/components/layout/SideBar.tsx
git commit -m "feat(analytics): 개인정보 설정 진입점 추가" -m "- 홈 프로필 메뉴와 메인 사이드바에서 설정 페이지 연결"
```

---

### Task 6: 운영 문서와 전체 회귀 검증

**Files:**
- Modify: `docs/analytics/ga4-operations.md`

**Interfaces:**
- Consumes: 완성된 동의·철회 동작과 `/privacy-settings`
- Produces: 배포 운영자용 Consent Mode·철회 검증 절차

- [ ] **Step 1: 더 이상 맞지 않는 범위 제외 문구 제거**

Delete this paragraph from `docs/analytics/ga4-operations.md`:

```md
분석 동의를 나중에 변경하거나 철회하는 설정 화면은 이 작업의 범위가 아니며 별도 GitHub 이슈에서 추적한다.
```

- [ ] **Step 2: 동의 정책과 버전 운영 절차 추가**

Insert before `## GA 관리자 설정`:

```md
## 분석 동의 변경 및 철회

우때는 기본 동의 모드를 사용한다. 선택 전과 거부 상태에서는 gtag.js를 로드하거나 쿠키 없는 분석 핑을 보내지 않는다.

- 공개 `/privacy-settings`에서 로그인 여부와 관계없이 현재 선택을 확인하고 변경할 수 있다.
- `analytics_storage`만 사용자 선택에 따라 바뀐다.
- `ad_storage`, `ad_user_data`, `ad_personalization`은 항상 `denied`다.
- 철회하면 `user_id`를 `null`로 초기화하고 분석 저장소를 거부한 뒤 `_ga`, `_ga_*` 쿠키 삭제를 시도한다.
- 기존 `granted`, `denied`는 v1 선택으로 인정하며 다음 변경부터 `v1:granted`, `v1:denied`로 저장한다.
- 수집 목적, 제공자, 데이터 범위처럼 동의의 의미가 중대하게 바뀔 때만 정책 버전을 올리고 재동의를 받는다.
```

- [ ] **Step 3: 배포 전 검증 체크리스트 확장**

Append these checks under `## 배포 전 검증`, then renumber the full list:

```md
1. 선택 전에는 gtag.js 요청, `window.gtag`, GA 이벤트가 없는지 확인한다.
2. 허용하면 Consent Mode 명령이 `default denied → analytics_storage granted → config` 순서인지 확인한다.
3. `/privacy-settings`에서 거부하면 User-ID가 초기화되고 추가 `page_view`와 일반 이벤트가 중단되는지 확인한다.
4. 철회 후 `_ga`, `_ga_*` 쿠키가 제거되고 새로고침 뒤 `v1:denied`가 유지되는지 확인한다.
5. 다시 허용하면 `config`와 현재 페이지뷰가 중복되지 않고 추적이 재개되는지 확인한다.
6. 홈 프로필 메뉴와 메인 사이드바에서 키보드로 개인정보 설정에 진입할 수 있는지 확인한다.
```

기존 검색어·이벤트·내부 트래픽 검증 항목은 위 여섯 항목 뒤에 그대로 유지한다.

- [ ] **Step 4: 분석 관련 자동 테스트 실행**

Run: `npm test -- src/lib/analytics/consent-cookie.test.ts src/lib/analytics/consent-store.test.ts src/lib/analytics/consent-actions.test.ts src/lib/analytics/client.test.ts src/lib/analytics/track.test.ts src/components/analytics/AnalyticsConsentSettings.test.tsx src/components/analytics/PrivacySettingsLink.test.tsx`

Expected: PASS for every consent, command, delivery gate, settings view, and navigation-link test.

- [ ] **Step 5: 전체 자동 검증 실행**

Run: `npm test`

Expected: PASS for all test files with no regression.

Run: `npx tsc --noEmit`

Expected: PASS with no TypeScript diagnostics.

Run: `npm run lint -- src/lib/analytics/consent-cookie.ts src/lib/analytics/consent-cookie.test.ts src/lib/analytics/consent-store.ts src/lib/analytics/consent-store.test.ts src/lib/analytics/consent-actions.ts src/lib/analytics/consent-actions.test.ts src/lib/analytics/client.ts src/lib/analytics/client.test.ts src/lib/analytics/track.ts src/lib/analytics/track.test.ts src/lib/analytics/paths.ts src/components/analytics/ConsentGatedAnalytics.tsx src/components/analytics/AnalyticsConsentSettings.tsx src/components/analytics/AnalyticsConsentSettings.test.tsx src/components/analytics/PrivacySettingsLink.tsx src/components/analytics/PrivacySettingsLink.test.tsx src/app/privacy-settings/page.tsx src/app/home/_components/HomeHeader.tsx src/components/layout/SideBar.tsx`

Expected: PASS with no errors or warnings in changed source and test files.

Run: `git diff --check`

Expected: no output.

- [ ] **Step 6: 브라우저 동작 검증**

Run: `NEXT_PUBLIC_GA_DEBUG_MODE=true NEXT_PUBLIC_GA_MEASUREMENT_ID=G-TEST123 npm run dev`

Expected manual checks in a clean browser profile:

1. 선택 전 Network에 `gtag/js`와 `google-analytics.com` 요청이 없다.
2. 배너 허용 후 `document.cookie`에 `uttae_analytics_consent=v1:granted`가 있고 첫 페이지뷰가 한 번이다.
3. `/privacy-settings`에서 거부 후 상태가 `분석 쿠키 거부`로 바뀌고 `_ga*` 쿠키와 추가 이벤트가 없다.
4. 새로고침 후 거부 상태가 유지되고 배너가 다시 뜨지 않는다.
5. 다시 허용 후 `config` 중복 없이 현재 페이지뷰가 한 번 발생한다.
6. 홈 프로필 메뉴와 메인 사이드바 링크를 키보드로 열 수 있다.

- [ ] **Step 7: 운영 문서 커밋**

```bash
git add docs/analytics/ga4-operations.md
git commit -m "docs(analytics): 동의 철회 운영 절차 추가" -m "- 기본 동의 모드와 정책 버전 기준 기록\n- 허용과 철회 및 재허용 배포 검증 절차 보강"
```

---

## Self-Review

- Spec coverage: 공개 설정 화면, 홈·사이드바 진입점, 레거시 쿠키 유지, v1 저장, Consent Mode v2, 광고 동의 상시 거부, User-ID 초기화, GA 쿠키 삭제, 페이지뷰·이벤트 게이트, 재허용, 저장 실패 안내, 운영 문서를 Task 1~6에 모두 연결했다.
- Placeholder scan: 미정 항목이나 추상적인 오류 처리 지시가 없으며 각 변경 단계에 파일, 코드, 명령, 기대 결과가 있다.
- Type consistency: `AnalyticsConsentValue`, `AnalyticsConsentState`, `AnalyticsConsentUpdateResult`, `analyticsConsentStore`, `grantAnalyticsConsent`, `denyAnalyticsConsent`, `ANALYTICS_CONSENT_SETTINGS_PATH` 이름이 생산 Task와 소비 Task에서 일치한다.
- Dependency check: React DOM 서버 렌더링과 주입 가능한 저장소를 사용하므로 jsdom이나 Testing Library를 추가하지 않는다.
