# Schedule Item Insert Delta Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 일정 항목을 서버에서 지정 위치에 직접 삽입하고, 생성 항목과 변경된 기존 항목의 델타를 HTTP 응답으로 반환해 요청 당사자의 캐시를 정확히 동기화한다.

**Architecture:** 생성 요청에 0-based `orderIndex`를 선택 필드로 추가하며 생략 시 맨 뒤에 삽입한다. 백엔드는 일정 단위 쓰기 잠금 아래 기존 항목을 이동하고 실제 직전 항목 기준으로 이동수단을 추천한 뒤 `createdItem`, `updatedItems`, `affectedRouteItemIds`를 반환한다. 프론트는 별도 reorder 요청 없이 응답 델타를 기존 캐시에 병합하고, 병합이 불가능한 경우에만 전체 항목을 재조회한다.

**Tech Stack:** Java 21, Spring Boot 4, JPA, JUnit 5, Mockito, TypeScript, TanStack Query, Vitest

## Global Constraints

- `orderIndex`는 기존 reorder API와 동일한 0-based 인덱스다.
- `orderIndex` 생략은 기존 호환 동작인 맨 뒤 추가다.
- `updatedItems`는 순서 또는 `travelMode`가 실제로 변경된 기존 항목만 포함한다.
- 요청 당사자는 HTTP 응답을 정본으로 반영하고 자신의 STOMP 이벤트를 계속 무시한다.
- 사용자 소유의 기존 프론트 변경(`package*.json`, `src/lib/maps.ts`, `src/lib/maps-routes.test.ts`)은 건드리지 않는다.

---

### Task 1: Backend insert-and-delta contract

**Files:**
- Create: `/Users/minbros/projects/uttae-backend/src/main/java/com/howaboutus/backend/schedules/service/dto/ScheduleItemCreateResult.java`
- Create: `/Users/minbros/projects/uttae-backend/src/main/java/com/howaboutus/backend/schedules/controller/dto/CreateScheduleItemResponse.java`
- Modify: `/Users/minbros/projects/uttae-backend/src/main/java/com/howaboutus/backend/schedules/controller/dto/CreateScheduleItemRequest.java`
- Modify: `/Users/minbros/projects/uttae-backend/src/main/java/com/howaboutus/backend/schedules/service/dto/ScheduleItemCreateCommand.java`
- Modify: `/Users/minbros/projects/uttae-backend/src/main/java/com/howaboutus/backend/schedules/service/ScheduleItemService.java`
- Modify: `/Users/minbros/projects/uttae-backend/src/main/java/com/howaboutus/backend/schedules/controller/ScheduleItemController.java`
- Test: `/Users/minbros/projects/uttae-backend/src/test/java/com/howaboutus/backend/schedules/service/ScheduleItemServiceTest.java`
- Test: `/Users/minbros/projects/uttae-backend/src/test/java/com/howaboutus/backend/schedules/controller/ScheduleItemControllerTest.java`

**Interfaces:**
- Consumes: `ScheduleItemCreateCommand(String googlePlaceId, LocalTime startTime, Integer durationMinutes, Integer orderIndex)`
- Produces: `ScheduleItemCreateResult(ScheduleItemResult createdItem, List<ScheduleItemResult> updatedItems, List<Long> affectedRouteItemIds)` and the same JSON shape through `CreateScheduleItemResponse`.

- [ ] **Step 1: Write failing service tests** for middle insertion, append fallback, invalid index, shifted item deltas, recommended predecessor delta, and emitted affected route IDs.
- [ ] **Step 2: Run `./gradlew test --tests '*ScheduleItemServiceTest'`** and confirm failure because the new command/result contract and insertion behavior do not exist.
- [ ] **Step 3: Write failing controller tests** asserting `orderIndex` validation/forwarding and the nested `createdItem`/`updatedItems`/`affectedRouteItemIds` response.
- [ ] **Step 4: Run `./gradlew test --tests '*ScheduleItemControllerTest'`** and confirm the old flat response fails.
- [ ] **Step 5: Implement the minimal backend contract and transaction logic.** Load ordered items after taking the existing schedule write lock, validate `0..size`, shift `targetIndex..end`, create at the target, recommend from `targetIndex - 1`, collect changed existing items, and publish `SCHEDULE_ITEM_CREATED` after constructing the delta result.
- [ ] **Step 6: Run both focused backend test classes** and confirm they pass.

### Task 2: Frontend delta request and cache merge

**Files:**
- Modify: `/Users/minbros/projects/uttae-frontend/src/lib/api/rooms/schedule-items.ts`
- Modify: `/Users/minbros/projects/uttae-frontend/src/lib/plan/scheduleItemPlaces.ts`
- Test: `/Users/minbros/projects/uttae-frontend/src/lib/plan/scheduleItemPlaces.test.ts`

**Interfaces:**
- Consumes: `CreateScheduleItemResponse { createdItem, updatedItems, affectedRouteItemIds }`.
- Produces: one POST carrying `orderIndex`, no follow-up reorder request, and an exact cache array with updated predecessor fields plus the created item at its returned index.

- [ ] **Step 1: Write failing Vitest cases** that merge a middle-insert delta, immediately apply a predecessor `WALKING` recommendation, and reject a delta whose updated item is absent from the cache.
- [ ] **Step 2: Run `npm test -- src/lib/plan/scheduleItemPlaces.test.ts`** and confirm failure because the delta merge helper does not exist.
- [ ] **Step 3: Implement frontend request/response types and pure delta merge.** Insert `createdItem` at its returned index, apply every `updatedItems` payload to matching cached places, and return `null` on divergence.
- [ ] **Step 4: Replace create-then-reorder with one create request.** On successful merge set the cache; on divergence fetch `GET items`; invalidate the route segments touching the created item from the merged order and preserve self-STOMP ignore behavior.
- [ ] **Step 5: Run the focused Vitest file** and confirm it passes.

### Task 3: API documentation and verification

**Files:**
- Modify: `/Users/minbros/projects/uttae-backend/docs/ai/features.md`
- Modify annotations in the request/response DTOs and controller from Task 1.

**Interfaces:**
- Consumes: implemented runtime behavior.
- Produces: OpenAPI showing optional 0-based `orderIndex` and the delta response schema; feature docs describing insertion-position recommendation.

- [ ] **Step 1: Update feature and OpenAPI descriptions** only after runtime behavior is green.
- [ ] **Step 2: Run backend focused tests, `./gradlew compileJava`, and `./gradlew checkstyleMain checkstyleTest`.**
- [ ] **Step 3: Run frontend focused tests, `npm test`, `npm run lint`, and `npx tsc --noEmit`.**
- [ ] **Step 4: Restart or use the running backend as appropriate and inspect `/v3/api-docs`** for `orderIndex`, `createdItem`, `updatedItems`, and `affectedRouteItemIds`.
- [ ] **Step 5: Review both git diffs and confirm unrelated dirty frontend files were not modified.**
