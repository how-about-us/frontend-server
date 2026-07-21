# GA4 Measurement Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task by task.

**Goal:** GA4 페이지뷰 중복과 민감 URL 수집 위험을 줄이고, 이벤트 명세와 운영 설정을 일관되게 정비한다.

**Architecture:** GA 스크립트 초기화, 런타임 활성화 조건, 이벤트 전송을 작은 분석 모듈로 분리한다. 자동 페이지뷰는 비활성화하고 App Router 경로 변경마다 정규화된 수동 `page_view`만 전송한다. 동의 변경·철회 UI는 이 작업에서 제외하고 별도 이슈로 관리한다.

**Tech Stack:** Next.js 16.2.1, React 19.2.4, TypeScript, Vitest, gtag.js

## Global Constraints

- 분석 동의 변경·철회 기능은 구현하지 않고 별도 GitHub 이슈로 추적한다.
- 기존의 최초 분석 동의 게이트는 유지한다.
- 초대 코드, 방·폴더 ID, 검색어, OAuth 파라미터를 GA URL에 보내지 않는다.
- `page_view`는 라우트 변경당 한 번만 애플리케이션에서 전송한다.
- 이벤트 파라미터는 이벤트별 타입으로 제한한다.

---

### Task 1: 페이지 경로 및 페이지뷰 정규화

**Files:**

- Modify: `src/lib/analytics/context.test.ts`
- Modify: `src/lib/analytics/context.ts`

- [ ] **Step 1: 실패하는 정규화 테스트 작성**

  `/join/:inviteCode`, `/plan/:roomId`, `/bookmark/:folderId`가 각각 라우트 템플릿으로 바뀌고 쿼리·해시가 제거되는 사례를 추가한다.

- [ ] **Step 2: 실패하는 페이지뷰 페이로드 테스트 작성**

  `page_path`, 쿼리가 제거된 `page_location`, 정규화된 `page_referrer`, `page_title`을 검증한다.

- [ ] **Step 3: 테스트 실패 확인**

  Run: `npm test -- src/lib/analytics/context.test.ts`

- [ ] **Step 4: 최소 구현 추가**

  `analyticsPagePath`, `buildAnalyticsPageView` 및 referrer 정규화 함수를 구현한다.

- [ ] **Step 5: 테스트 통과 확인**

  Run: `npm test -- src/lib/analytics/context.test.ts`

### Task 2: GA 런타임과 수동 페이지뷰 단일화

**Files:**

- Create: `src/lib/analytics/runtime.test.ts`
- Create: `src/lib/analytics/runtime.ts`
- Create: `src/lib/analytics/client.ts`
- Create: `src/components/analytics/GoogleAnalyticsScript.tsx`
- Modify: `src/components/analytics/ConsentGatedAnalytics.tsx`
- Modify: `src/components/analytics/AnalyticsRouteTracker.tsx`
- Modify: `src/lib/analytics/track.ts`
- Modify: `src/providers/root-providers.tsx`

- [ ] **Step 1: 실패하는 런타임 설정 테스트 작성**

  올바른 `G-...` 측정 ID만 허용하고, 프로덕션 또는 명시적 디버그 모드에서만 분석이 켜지는지 검증한다.

- [ ] **Step 2: 테스트 실패 확인**

  Run: `npm test -- src/lib/analytics/runtime.test.ts`

- [ ] **Step 3: 런타임 설정 최소 구현**

  `resolveAnalyticsRuntime`으로 측정 ID, 활성화 여부, `debug_mode` 여부를 한 곳에서 결정한다.

- [ ] **Step 4: gtag 초기화와 전송 래퍼 구현**

  `config` 호출에 `{ send_page_view: false }`를 강제하고 디버그 모드에서는 `{ debug_mode: true }`도 설정한다.

- [ ] **Step 5: 동의 게이트와 라우트 추적기 연결**

  기존 `GoogleAnalytics` 컴포넌트를 커스텀 스크립트로 교체하고, 라우트 변경 시 `buildAnalyticsPageView(...)`로 만든 단일 `page_view`를 보낸다.

- [ ] **Step 6: 관련 테스트 통과 확인**

  Run: `npm test -- src/lib/analytics/runtime.test.ts src/lib/analytics/context.test.ts src/lib/analytics/track.test.ts`

### Task 3: 이벤트 이름 및 이벤트별 파라미터 스키마 정비

**Files:**

- Modify: `src/lib/analytics/track.test.ts`
- Modify: `src/lib/analytics/track.ts`
- Modify: analytics call sites under `src/`

- [ ] **Step 1: 권장 이벤트 이름의 실패 테스트 작성**

  일정 공유는 GA 권장 이벤트 `share`, 일정 참여는 `join_group`으로 기대값을 변경한다.

- [ ] **Step 2: 테스트 실패 확인**

  Run: `npm test -- src/lib/analytics/track.test.ts`

- [ ] **Step 3: 이벤트 이름 및 타입 구현**

  호출부의 의미는 유지하면서 상수 값을 변경하고, 이벤트 이름별로 허용되는 파라미터를 매핑한 제네릭 `trackAnalyticsEvent`를 구현한다.

- [ ] **Step 4: 타입과 테스트 검증**

  Run: `npm test -- src/lib/analytics/track.test.ts`

  Run: `npx tsc --noEmit`

### Task 4: GA4 운영 체크리스트 문서화

**Files:**

- Create: `docs/analytics/ga4-operations.md`

- [ ] **Step 1: 코드와 GA 관리자 설정의 책임 경계 기록**

  자동 페이지뷰 비활성화, DebugView, 개발자·내부 트래픽 필터, URL 데이터 삭제, 맞춤 측정기준, 주요 이벤트, 보관 기간을 체크리스트로 작성한다.

- [ ] **Step 2: 개인정보 보호 점검 항목 기록**

  User-ID를 맞춤 측정기준으로 만들지 않는 원칙과 쿼리 파라미터 차단 목록을 문서화한다.

### Task 5: 전체 검증과 변경 검토

**Files:**

- Review all changed files

- [ ] **Step 1: 전체 테스트 실행**

  Run: `npm test`

- [ ] **Step 2: 타입 검사 실행**

  Run: `npx tsc --noEmit`

- [ ] **Step 3: 변경 파일 린트 실행**

  Run: `npx eslint <changed TypeScript files>`

- [ ] **Step 4: diff 안전성 확인**

  Run: `git diff --check`

- [ ] **Step 5: 별도 동의 관리 이슈 상태 보고**

  이슈 생성 권한 승인이 없으면 사용자에게 정확한 실패 사유와 재시도에 필요한 승인을 요청한다.
