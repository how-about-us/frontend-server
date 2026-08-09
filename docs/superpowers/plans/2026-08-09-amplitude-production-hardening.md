# Amplitude Production Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate Amplitude configuration by deployment environment, reduce production Session Replay exposure, and document the event contract and operating checks.

**Architecture:** A pure runtime resolver owns environment parsing and defaults, while the browser-only Amplitude adapter consumes that resolved configuration exactly once after analytics consent. Product events continue to use the existing typed analytics facade so GA4 and Amplitude receive the same semantic event without duplicating page-view autocapture.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, `@amplitude/unified` 1.1.28

## Global Constraints

- All Amplitude SDK code runs only in the browser and only after analytics consent.
- `amplitude.initAll` runs at most once during the application lifecycle.
- The API key comes from `NEXT_PUBLIC_AMPLITUDE_API_KEY`; different Amplitude projects provide different values for development, preview, and production.
- Production Session Replay defaults to `0.1`; development defaults to `1`; `NEXT_PUBLIC_AMPLITUDE_SESSION_REPLAY_SAMPLE_RATE` may override either with a value from `0` through `1`.
- Session Replay uses conservative text masking and stable block/mask data-attribute selectors.
- Custom `page_view` and typed product events remain authoritative; broad element, form, download, network, and performance autocapture stays disabled.
- Commit messages follow Korean Conventional Commits.

---

### Task 1: Resolve environment-specific Amplitude runtime configuration

**Files:**
- Create: `src/lib/analytics/amplitude-runtime.test.ts`
- Create: `src/lib/analytics/amplitude-runtime.ts`

**Interfaces:**
- Consumes: `NEXT_PUBLIC_AMPLITUDE_API_KEY`, `NEXT_PUBLIC_AMPLITUDE_SESSION_REPLAY_SAMPLE_RATE`, and `NODE_ENV`.
- Produces: `resolveAmplitudeRuntime(input): AmplitudeRuntime` and the build-time `amplitudeRuntime` constant.

- [ ] **Step 1: Write the failing resolver tests**

```ts
expect(resolveAmplitudeRuntime({ apiKey: " prod-key ", nodeEnv: "production" })).toEqual({
  apiKey: "prod-key",
  enabled: true,
  sessionReplaySampleRate: 0.1,
});
expect(resolveAmplitudeRuntime({ apiKey: "", nodeEnv: "production" }).enabled).toBe(false);
expect(resolveAmplitudeRuntime({ apiKey: "dev-key", nodeEnv: "development" }).sessionReplaySampleRate).toBe(1);
expect(resolveAmplitudeRuntime({
  apiKey: "preview-key",
  nodeEnv: "production",
  sessionReplaySampleRate: "0.25",
}).sessionReplaySampleRate).toBe(0.25);
```

- [ ] **Step 2: Run the resolver test and verify RED**

Run: `npm test -- src/lib/analytics/amplitude-runtime.test.ts`

Expected: FAIL because `@/lib/analytics/amplitude-runtime` does not exist.

- [ ] **Step 3: Implement the minimal resolver**

```ts
const DEFAULT_PRODUCTION_REPLAY_SAMPLE_RATE = 0.1;
const DEFAULT_NON_PRODUCTION_REPLAY_SAMPLE_RATE = 1;

export function resolveAmplitudeRuntime(input: AmplitudeRuntimeInput): AmplitudeRuntime {
  const apiKey = input.apiKey?.trim() ?? "";
  const configuredRate = Number(input.sessionReplaySampleRate);
  const defaultRate = input.nodeEnv === "production" ? 0.1 : 1;
  const sessionReplaySampleRate =
    input.sessionReplaySampleRate !== undefined &&
    Number.isFinite(configuredRate) &&
    configuredRate >= 0 &&
    configuredRate <= 1
      ? configuredRate
      : defaultRate;

  return { apiKey: apiKey || null, enabled: Boolean(apiKey), sessionReplaySampleRate };
}
```

- [ ] **Step 4: Run the resolver test and verify GREEN**

Run: `npm test -- src/lib/analytics/amplitude-runtime.test.ts`

Expected: PASS with no warnings.

### Task 2: Harden the consent-gated browser initializer

**Files:**
- Modify: `src/lib/analytics/amplitude.test.ts`
- Modify: `src/lib/analytics/amplitude.ts`

**Interfaces:**
- Consumes: `amplitudeRuntime` from Task 1.
- Produces: the existing `initializeAmplitude`, `sendAmplitudeDataCommand`, and `revokeAmplitudeConsent` browser-only API.

- [ ] **Step 1: Change the initializer test first**

Stub the public environment values before importing the module and assert the resolved key, explicit autocapture policy, replay rate, and privacy policy:

```ts
expect(amplitude.initAll).toHaveBeenCalledWith("test-api-key", {
  analytics: {
    autocapture: {
      attribution: true,
      elementInteractions: false,
      fileDownloads: false,
      formInteractions: false,
      frustrationInteractions: false,
      networkTracking: false,
      pageUrlEnrichment: true,
      pageViews: false,
      performanceTracking: false,
      sessions: true,
      webVitals: false,
    },
  },
  sessionReplay: {
    privacyConfig: {
      blockSelector: [".amp-block", "[data-amplitude-block]"],
      defaultMaskLevel: "conservative",
      maskSelector: [".amp-mask", "[data-amplitude-mask]"],
    },
    sampleRate: 0.2,
  },
});
```

Add a second test proving that a missing key neither initializes the SDK nor flushes queued events.

- [ ] **Step 2: Run the initializer test and verify RED**

Run: `npm test -- src/lib/analytics/amplitude.test.ts`

Expected: FAIL because the current code uses a hard-coded key, broad autocapture, and a `1.0` replay rate.

- [ ] **Step 3: Implement the minimal initializer changes**

Import `amplitudeRuntime`, return before SDK access when it is disabled, replace the hard-coded key, and pass the explicit options asserted above. Preserve the existing browser guard, singleton promise, consent opt-out behavior, and queued command handling.

- [ ] **Step 4: Run focused analytics tests and verify GREEN**

Run: `npm test -- src/lib/analytics/amplitude-runtime.test.ts src/lib/analytics/amplitude.test.ts src/lib/analytics/client-amplitude.test.ts src/components/analytics/ConsentGatedAnalytics.amplitude.test.tsx src/providers/app-chrome-shell.amplitude.test.tsx`

Expected: all focused tests PASS with no warnings.

### Task 3: Document the event contract and deployment operations

**Files:**
- Create: `docs/analytics/amplitude-operations.md`
- Create: `docs/analytics/amplitude-tracking-plan.md`

**Interfaces:**
- Consumes: event names and property types from `src/lib/analytics/track.ts` and bucket values from `src/lib/analytics/context.ts`.
- Produces: the deployment checklist, privacy policy, dashboard starter funnels, and the canonical human-readable event dictionary.

- [ ] **Step 1: Write the operations guide**

Document separate Amplitude projects and API keys for Development, Preview, and Production; the replay-rate override; conservative masking and `data-amplitude-mask` / `data-amplitude-block`; AdGuard allowlisting for `api2.amplitude.com`, `sr-client-cfg.amplitude.com`, and `api-sr.amplitude.com`; dashboard verification; and the optional first-party proxy decision.

- [ ] **Step 2: Write the tracking plan**

List all 18 typed product events, their trigger, required and optional properties, allowed enum/bucket values, and the rule that raw search terms, message contents, user names, trip titles, invite codes, and place IDs are forbidden event properties.

- [ ] **Step 3: Self-review the documentation against source types**

Compare every event and property in `docs/analytics/amplitude-tracking-plan.md` with `AnalyticsEvents` and `AnalyticsEventParamsMap`; fix any mismatch before verification.

### Task 4: Verify, commit, and push

**Files:**
- Verify all modified and newly created files in the worktree.

**Interfaces:**
- Consumes: Tasks 1 through 3.
- Produces: tested commits on `codex/ga4-utm-page-location` pushed to `origin`.

- [ ] **Step 1: Run full automated verification**

Run: `npm test`

Run: `npm run lint`

Run: `npm run build`

Expected: all commands exit `0` without new warnings or errors.

- [ ] **Step 2: Review the final diff and secret exposure**

Run: `git diff --check`

Run: `git status --short`

Confirm that no `.env.local` value or API key literal is staged.

- [ ] **Step 3: Commit the implementation**

Commit title: `feat(analytics): Amplitude 운영 설정 강화`

Commit body:

```text
- 환경별 API 키와 Session Replay 샘플링 설정 추가
- 자동 수집 중복 방지 및 보수적 텍스트 마스킹 적용
- Amplitude 이벤트 규약과 운영 체크리스트 문서화
```

- [ ] **Step 4: Push the current branch**

Run: `git push origin codex/ga4-utm-page-location`

Expected: the remote branch advances to the new commit.
