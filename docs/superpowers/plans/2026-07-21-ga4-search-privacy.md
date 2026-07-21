# GA4 Search Privacy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 검색어 원문을 수집하지 않으면서 검색 결과 노출을 GA4 권장 `view_search_results` 이벤트로 측정하고, 자동 사이트 검색 수집을 운영 절차에서 차단한다.

**Architecture:** 기존 검색 성공 시점과 중복 방지 로직은 유지하고 중앙 이벤트 상수의 실제 이름만 `view_search_results`로 변경한다. 이벤트별 TypeScript 파라미터 맵은 검색 방식과 결과 수 버킷만 허용하며, GA 관리자에서 필요한 사이트 검색 비활성화와 네트워크 검증은 운영 문서에 명시한다.

**Tech Stack:** Next.js 16.2.1, React 19.2.4, TypeScript 5, Vitest 4.1.10, gtag.js/GA4

## Global Constraints

- 사용자가 입력한 검색어 원문은 GA4 이벤트, 페이지뷰, URL 필드, 사용자 속성으로 전송하지 않는다.
- 검색어를 해시하거나 일부 마스킹해서 보내지 않는다.
- 이벤트 이름은 `view_search_results`를 사용한다.
- 이벤트 파라미터는 `search_mode`, `result_count_bucket`만 허용한다.
- 검색 요청 실패 또는 취소 시 이벤트를 보내지 않는다.
- 기존 `searchGeneration` 중복 방지 로직과 검색 UI/API 동작은 변경하지 않는다.
- GA 관리자 계정의 실제 설정 변경은 코드 작업 범위에 포함하지 않는다.

---

### Task 1: 검색 결과 이벤트 명세 변경

**Files:**

- Modify: `src/lib/analytics/track.test.ts:1-32`
- Modify: `src/lib/analytics/track.ts:37-55`

**Interfaces:**

- Consumes: 기존 `AnalyticsEvents.search` 호출부와 `AnalyticsEventParamsMap[typeof AnalyticsEvents.search]`
- Produces: 값이 `view_search_results`인 `AnalyticsEvents.search`, 파라미터가 `search_mode`와 `result_count_bucket`으로 제한된 검색 이벤트 타입

- [ ] **Step 1: 이벤트 이름과 파라미터 타입을 고정하는 실패 테스트 작성**

`src/lib/analytics/track.test.ts`의 Vitest import에 `expectTypeOf`를 추가하고, 분석 모듈 import에 `type AnalyticsEventParamsMap`을 추가한다.

```ts
import { describe, expect, expectTypeOf, it } from "vitest";

import {
  AnalyticsEvents,
  type AnalyticsEventParamsMap,
  buildAnalyticsUserIdCommand,
  buildTutorialExitAnalyticsEvent,
} from "@/lib/analytics/track";
```

기존 `AnalyticsEvents` 전체 객체 기대값에서 검색 이벤트 값을 바꾼다.

```ts
search: "view_search_results",
```

같은 `describe("AnalyticsEvents", ...)` 블록에 검색 이벤트 파라미터 타입 검증을 추가한다.

```ts
it("keeps search-result analytics free of raw search terms", () => {
  type SearchResultParams =
    AnalyticsEventParamsMap[typeof AnalyticsEvents.search];

  expectTypeOf<SearchResultParams>().toEqualTypeOf<{
    result_count_bucket: "0" | "1_5" | "6_20" | "21_plus";
    search_mode: "map_recenter" | "text";
  }>();
});
```

- [ ] **Step 2: 테스트가 이벤트 이름 불일치로 실패하는지 확인**

Run:

```bash
npm test -- src/lib/analytics/track.test.ts
```

Expected: `AnalyticsEvents` 테스트가 `search: "search"`와 기대값 `search: "view_search_results"`의 차이로 실패한다. 타입 검증은 컴파일된다.

- [ ] **Step 3: 중앙 이벤트 상수의 실제 이름만 변경**

`src/lib/analytics/track.ts`에서 다음 한 줄을 변경한다.

```ts
search: "view_search_results",
```

`AnalyticsEventParamsMap`의 기존 검색 이벤트 타입은 다음 형태로 유지한다.

```ts
[AnalyticsEvents.search]: {
  result_count_bucket: ResultCountBucket;
  search_mode: "map_recenter" | "text";
};
```

- [ ] **Step 4: 집중 테스트와 타입 검사 통과 확인**

Run:

```bash
npm test -- src/lib/analytics/track.test.ts
npx tsc --noEmit
```

Expected: `track.test.ts`의 모든 테스트가 통과하고 TypeScript 오류가 없다. `src/app/(main)/search/page.tsx`는 상수 프로퍼티를 그대로 사용하므로 호출부 수정 없이 새 이벤트 이름을 전송한다.

- [ ] **Step 5: 이벤트 명세 변경 커밋**

```bash
git add src/lib/analytics/track.ts src/lib/analytics/track.test.ts
git commit -m "feat(analytics): 검색 결과 이벤트 명세 정비" -m "- 검색 결과 이벤트를 view_search_results로 변경
- 검색어 없는 저카디널리티 파라미터 타입을 검증"
```

---

### Task 2: GA4 사이트 검색 자동 수집 차단 문서화

**Files:**

- Modify: `docs/analytics/ga4-operations.md:39-109`

**Interfaces:**

- Consumes: Task 1의 `view_search_results` 이벤트 이름과 `search_mode`, `result_count_bucket` 파라미터
- Produces: GA 관리자 설정과 배포 검증에 사용하는 검색 개인정보 보호 체크리스트

- [ ] **Step 1: 향상된 측정의 사이트 검색 비활성화 절차 추가**

`자동 페이지뷰 끄기` 섹션 뒤에 다음 섹션을 추가하고 이후 관리자 설정 번호를 하나씩 올린다.

```md
### 2. 사이트 검색 자동 수집 끄기

관리자 → 데이터 스트림 → 웹 스트림 → 향상된 측정에서 `사이트 검색`을 끈다.

우때는 검색 결과가 확정된 시점에 `view_search_results`를 직접 전송하며, 검색어 원문은 보내지 않는다. 사이트 검색 자동 수집이 켜져 있으면 `/search?q=...`의 `q` 값이 `search_term`으로 별도 수집되고 수동 이벤트와 중복될 수 있다.

검색 이벤트에는 다음 파라미터만 허용한다.

- `search_mode`: `text` 또는 `map_recenter`
- `result_count_bucket`: `0`, `1_5`, `6_20`, `21_plus`

데이터 가림 대상의 `q`는 설정 누락에 대비한 이중 방어로 유지한다. 데이터 가림만으로 자동 생성된 `search_term` 파라미터의 부재를 보장한다고 간주하지 않는다.
```

- [ ] **Step 2: 배포 전 검증 목록을 검색어 비수집 기준으로 갱신**

기존 DebugView 이벤트 목록의 검색 항목을 `view_search_results`로 맞추고 다음 검증 항목을 추가한다.

```md
5. 텍스트 검색과 지도 재검색을 각각 한 번 실행해 `view_search_results`가 실행당 한 번만 발생하는지 확인한다.
6. DebugView와 `google-analytics.com/g/collect` 요청에 `search_term`, 검색어 원문, `q=<원문>`이 없는지 확인한다.
```

기존 개발자·내부 트래픽 필터 확인 항목은 번호를 뒤로 이동해 유지한다.

- [ ] **Step 3: 문서에 필수 운영 키워드가 모두 존재하는지 확인**

Run:

```bash
rg -n '사이트 검색|view_search_results|search_term|result_count_bucket|search_mode|q=<원문>' docs/analytics/ga4-operations.md
git diff --check
```

Expected: 각 키워드가 새 관리자 설정 또는 검증 절차에서 발견되고 공백 오류가 없다.

- [ ] **Step 4: 운영 문서 변경 커밋**

```bash
git add docs/analytics/ga4-operations.md
git commit -m "docs(analytics): 검색어 비수집 운영 절차 추가" -m "- 향상된 측정의 사이트 검색 비활성화를 명시
- DebugView와 수집 요청 검증 기준을 보강"
```

---

### Task 3: 전체 회귀 검증

**Files:**

- Verify: `src/lib/analytics/track.ts`
- Verify: `src/lib/analytics/track.test.ts`
- Verify: `src/app/(main)/search/page.tsx`
- Verify: `docs/analytics/ga4-operations.md`

**Interfaces:**

- Consumes: Task 1의 이벤트 명세와 Task 2의 운영 체크리스트
- Produces: 첫 번째 GA4 개인정보 개선을 배포할 수 있다는 검증 근거와 GA 관리자 수동 작업 목록

- [ ] **Step 1: 전체 테스트 실행**

Run:

```bash
npm test
```

Expected: 모든 Vitest 테스트 파일과 테스트가 실패 없이 통과한다.

- [ ] **Step 2: 타입 검사와 변경 파일 린트 실행**

Run:

```bash
npx tsc --noEmit
npx eslint src/lib/analytics/track.ts src/lib/analytics/track.test.ts 'src/app/(main)/search/page.tsx'
```

Expected: 두 명령 모두 종료 코드 0이며 오류가 없다.

- [ ] **Step 3: diff와 작업 트리 범위 확인**

Run:

```bash
git diff --check
git status --short
git log -3 --oneline
```

Expected: 공백 오류가 없고, 계획·설계·이벤트 명세·운영 문서 이외의 변경이 없다. 최근 커밋에 이벤트 명세 및 운영 문서 커밋이 나타난다.

- [ ] **Step 4: 코드로 적용할 수 없는 GA 관리자 작업 보고**

최종 보고에 다음 수동 작업을 정확히 남긴다.

```text
GA4 관리자 → 데이터 스트림 → 웹 스트림 → 향상된 측정 → 사이트 검색: 끔
데이터 가림 대상 쿼리 파라미터 `q`: 유지
DebugView/수집 요청: view_search_results 실행당 1회, search_term 및 q 원문 없음 확인
```
