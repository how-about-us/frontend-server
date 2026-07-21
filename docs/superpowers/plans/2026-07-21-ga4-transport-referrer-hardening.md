# GA4 중앙 전송 게이트와 리퍼러 보호 구현 계획

> 설계: `docs/superpowers/specs/2026-07-21-ga4-transport-referrer-hardening-design.md`

**목표:** GA 데이터 명령이 동의·런타임 검사를 우회하지 못하게 하고 외부 리퍼러의 불필요한 세부 정보를 제거한다.

**구조:** `client.ts`의 데이터 명령 함수가 유일한 런타임·동의 게이트와 전송 대기열을 소유한다. `context.ts`는 현재 출처를 기준으로 내부·외부 리퍼러를 서로 다르게 정규화한다.

**기술:** TypeScript, Vitest, Google tag/Consent Mode v2, Next.js App Router

---

## 작업 1: 중앙 데이터 명령 게이트

**파일:**

- 수정: `src/lib/analytics/client.ts`
- 수정: `src/lib/analytics/client.test.ts`
- 수정: `src/lib/analytics/track.ts`
- 수정: `src/lib/analytics/track.test.ts`

1. 직접 데이터 명령이 동의 거부 상태에서 폐기되고 이후 허용·초기화해도 되살아나지 않는 실패 테스트를 작성한다.
2. 허용된 초기화 전 명령의 FIFO 보류와 flush 시점 재검사를 포괄하는 테스트를 보강한다.
3. 집중 테스트의 실패를 확인한다.
4. 데이터 명령 함수에 런타임·동의 게이트를 중앙화하고 초기화 명령 경로와 이름을 구분한다.
5. 페이지뷰, User-ID, 일반 이벤트가 중앙 함수만 통해 전송되도록 정리한다.
6. 집중 테스트, TypeScript, 변경 파일 ESLint를 실행하고 커밋한다.

## 작업 2: 출처별 리퍼러 정규화

**파일:**

- 수정: `src/lib/analytics/context.ts`
- 수정: `src/lib/analytics/context.test.ts`
- 수정: `src/lib/analytics/page-view-session.test.ts`

1. 같은 출처의 동적 경로 정규화와 외부 출처 루트 보존에 대한 실패 테스트를 작성한다.
2. 외부 사용자 정보·경로·쿼리·해시, 비 HTTP(S), 잘못된 URL 제거 테스트를 추가한다.
3. 현재 페이지의 UTM·검색어와 외부 리퍼러 쿼리가 모두 제거되는 회귀 테스트를 추가한다.
4. 현재 출처를 기준으로 내부·외부 리퍼러를 나누는 최소 구현을 추가한다.
5. 집중 테스트, TypeScript, 변경 파일 ESLint를 실행하고 커밋한다.

## 작업 3: 운영 문서와 전체 검증

**파일:**

- 수정: `docs/analytics/ga4-operations.md`

1. 중앙 데이터 게이트, 외부 리퍼러 origin-only 정책, UTM 미수집과 캠페인 분석 제한을 기록한다.
2. 배포 전 검증 항목에 거부 상태 직접 전송 차단과 리퍼러 페이로드 확인을 추가한다.
3. 전체 테스트, `npx tsc --noEmit`, 변경 파일 ESLint, `git diff --check`를 새로 실행한다.
4. 작업 트리와 커밋 범위를 확인한다.
5. 구현 전체를 독립 리뷰하고 발견 사항을 수정한 뒤 재검증한다.
