# GA4 첫 페이지뷰와 User-ID 동기화 구현 계획

> 설계: `docs/superpowers/specs/2026-07-21-ga4-page-view-user-id-sync-design.md`

**목표:** 첫 `page_view`가 세션 확정 뒤 올바른 User-ID 상태로 한 번만 전송되게 한다.

**구조:** 순수 전송 계획 생성 함수가 세션 준비 상태와 현재 경로를 받아 User-ID 및 선택적 페이지뷰를 반환한다. `AnalyticsRouteTracker`는 단일 Effect에서 User-ID 명령을 먼저 실행하고 페이지뷰를 이어서 전송한다.

**기술:** React 19, Next.js App Router, TanStack Query v5, Zustand, Vitest, TypeScript

---

## 작업 1: 세션 기반 페이지뷰 전송 계획

**파일:**

- 생성: `src/lib/analytics/page-view-session.ts`
- 생성: `src/lib/analytics/page-view-session.test.ts`

1. 세션 준비 전, 쿼리 대기, 인증 성공, 비로그인 성공, 오류, 세션 조정 생략, 동일 경로를 포괄하는 실패 테스트를 작성한다.
2. 집중 테스트를 실행해 새 동작이 아직 없어 실패하는지 확인한다.
3. 최소 구현으로 User-ID와 선택적 페이지뷰 계획을 반환한다.
4. 집중 테스트를 다시 실행해 통과시킨다.
5. 변경을 한국어 Conventional Commit으로 커밋한다.

## 작업 2: 경로 규칙 공유와 트래커 통합

**파일:**

- 수정: `src/lib/auth.ts`
- 수정: `src/components/analytics/AnalyticsRouteTracker.tsx`
- 수정: `src/lib/analytics/page-view-session.test.ts`

1. 기존 `/login`, `/auth/callback` 세션 조정 생략 규칙을 외부에서 재사용할 수 있게 공개한다.
2. 경로 접두사·경계 사례에 대한 실패 테스트를 추가한다.
3. 트래커를 단일 Effect와 전송 계획 기반으로 변경한다.
4. User-ID 설정 후 페이지뷰 전송, 최신 경로만 전송, 동일 경로 중복 방지를 확인한다.
5. 집중 테스트, TypeScript, 변경 파일 ESLint를 실행하고 커밋한다.

## 작업 3: 운영 문서와 전체 검증

**파일:**

- 수정: `docs/analytics/ga4-operations.md`

1. 첫 페이지뷰와 User-ID 순서, 세션 예외 경로의 익명 처리 규칙을 운영 문서에 기록한다.
2. 배포 전 검증 항목에 인증/비인증 첫 화면과 빠른 리다이렉트 검증을 추가한다.
3. 전체 테스트, `tsc --noEmit`, 변경 파일 ESLint를 새로 실행한다.
4. diff와 작업 트리 상태를 확인하고 커밋한다.
5. 구현 전체를 별도 리뷰한 뒤 발견 사항을 수정하고 재검증한다.
