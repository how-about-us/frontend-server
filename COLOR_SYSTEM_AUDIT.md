# 컬러 시스템 현황 조사

## 1. 글로벌 설정

### 1.1 Tailwind 컬러 정의 (tailwind.config.js)

```javascript
colors: {
  "brand-red": "#f12d33",
  "light-gray": "#d9d9d9",
  "brand-green": "#03c75a",
  "dark-gray": "#6a7282",
  "gray-border": "#e5e7eb",
  "bubble-gray": "#f1f1f1",
  "ai-bubble": "#ebf1f5",
  "ai-bubble-border": "#c9d4df",
  "muted-brown": "#695656",
  "gray-300": "#e2e8f0",
}
```

**특징:**
- 10개의 커스텀 색상만 정의됨
- 나머지는 기본 Tailwind 색상(neutral, gray, red, blue 등) 사용
- 모두 헥스값으로 정의됨

### 1.2 CSS 설정 (globals.css)

**정의된 컬러:**
- 스크롤바: `#cbd5e1` (thumb), `#f3f4f6` (track)
- 스크롤바 경계: `#e5e7eb`
- 호버 상태: `#94a3b8`

**특징:**
- CSS 변수 정의 없음
- 스크롤바 색상이 hardcoded로 정의됨
- Tailwind 클래스나 design token이 아닌 직접 색상값 사용

## 2. 실제 구현 현황

### 2.1 색상 사용 패턴별 분류

#### A) Tailwind 클래스명 사용 (권장)
```tsx
// 가장 많이 사용되는 패턴
className="bg-white text-dark-gray border-gray-border"
className="bg-bubble-gray text-neutral-900"
className="bg-brand-red text-white"
```

**특징:**
- 대부분의 일반 컴포넌트에서 사용
- 유지보수하기 좋음
- 탐색 가능함

**사용 파일들:**
- `src/components/layout/*` - HeaderBar, SiteFooter 등
- `src/app/(main)/bookmark/*` - 북마크 컴포넌트들
- `src/app/(main)/plan/*` - 플랜 관련 컴포넌트들
- 대부분의 모달, 버튼, 입력 필드

---

#### B) 임의값 (Arbitrary Values) - 인라인 색상
```tsx
// 랜딩 페이지
className="bg-[#211719] text-white"
className="text-[#ff8589]"
className="text-[#99A1AF]"

// 배경 그래디언트
className="bg-gradient-to-b from-bubble-gray/80 via-white to-white"
className="bg-[radial-gradient(circle_at_50%_12%,rgba(241,45,51,0.11),transparent_35%)]"
```

**특징:**
- Tailwind의 임의값 문법으로 정의됨
- CSS가 동적으로 생성됨
- 색상 변경 시 모든 파일에서 찾아서 수정해야 함

**사용 파일들 (주요):**
- `src/app/_components/LandingHero.tsx` - 많은 임의 색상값
- `src/app/_components/LandingHeader.tsx` - 텍스트 색상
- `src/app/waiting/page.tsx` - 배경 그래디언트
- `src/app/(main)/search/page.tsx` - 검색 페이지 스타일
- `src/app/home/*` - 홈페이지 관련

**발견된 색상들:**
```
#211719 (다크 배경)
#ff8589 (텍스트 강조)
#99A1AF (텍스트 보조)
#1f1f1f (검은색 텍스트)
#4ade80 (초록색)
#FDC700 (노란색)
#ebebeb (연한 배경)
```

---

#### C) inline style 속성
```tsx
// 북마크 색상 선택
style={{ 
  backgroundColor: hex,
  borderColor: color === hex ? "#171717" : "transparent",
  boxShadow: color === hex ? "0 0 0 2px white, 0 0 0 4px #171717" : "",
}}

// 동적 색상 (사용자 선택 또는 데이터 기반)
style={{ backgroundColor: c.colorCode }}
style={{ color: selectedPlace.bookmarkCategoryColor.trim() }}
```

**특징:**
- 주로 동적 색상이 필요할 때 사용
- 사용자가 선택하거나 API에서 받는 색상

**사용 파일들:**
- `src/app/(main)/bookmark/_components/AddBookmarkModal.tsx` - 컬러 선택
- `src/components/place/*` - 장소 컴포넌트
- `src/components/chat/*` - 채팅 관련

---

#### D) 프로그래매틱 색상 생성
```typescript
// 플랜 일차별 경로 색상 - HSL → RGB 변환
src/lib/plan/planRouteDayColors.ts

const GOLDEN_ANGLE_HUE_STEP = 137.5083565656715;

export function scheduleIdsToRouteColors(
  sortedScheduleIds: number[],
  roomId?: string,
): Map<number, string> {
  // 방별로 색상 오프셋을 다르게 하여 동적으로 색상 생성
}
```

**특징:**
- 방마다 다른 색상 팔레트 생성
- 구간별로 고정된 색상 사용
- 알고리즘 기반 색상 생성

---

#### E) 색상 프리셋 정의
```typescript
// AddBookmarkModal.tsx
const COLOR_PRESETS = [
  "#EAB308", // 노랑
  "#14B8A6", // 민트
  "#F12D33", // 빨강 (brand-red)
  "#3B82F6", // 파랑
  "#A855F7", // 보라
  "#EC4899", // 핑크
  "#22C55E", // 초록
  "#F97316", // 주황
] as const;
```

**특징:**
- 북마크 폴더의 색상 선택 옵션
- 하드코딩된 배열로 정의
- 사용자가 이 중에서 선택하거나 커스텀 색상 선택 가능

---

### 2.2 색상 사용 분포

**정리된 상태 (Tailwind 클래스 사용):**
- ✅ 기본 UI 컴포넌트 (버튼, 입력, 모달)
- ✅ 레이아웃 (헤더, 푸터, 사이드바)
- ✅ 북마크 기능
- ✅ 플랜/일정 기본 요소
- ✅ 채팅 기본 구조

**정리 필요한 부분 (임의값/인라인):**
- ❌ 랜딩 페이지 (`src/app/_components/Landing*.tsx`) - 매우 많은 임의값
- ❌ 검색 페이지 색상 - rgba 값들
- ❌ 로그인/대기 페이지 - 그래디언트, 배경색
- ❌ globals.css 스크롤바 색상 - hardcoded
- ❌ 일부 SVG/아이콘 색상 - hardcoded

**동적 색상 (관리 필요):**
- 북마크 폴더 색상 선택 (8가지 프리셋 + 커스텀)
- 플랜 일차 경로 색상 (동적 생성)
- 장소 카테고리 색상 (API 기반)

---

### 2.3 파일별 색상 사용 현황

#### 임의값 많이 사용하는 파일 (상위 5개)

| 파일명 | 특징 | 색상 수 |
|--------|------|--------|
| `src/app/_components/LandingHero.tsx` | 랜딩 페이지 - 그래디언트, 텍스트 색상 | 다수 |
| `src/app/_components/LandingHeader.tsx` | 랜딩 헤더 | 다수 |
| `src/app/(main)/search/page.tsx` | 검색 페이지 - rgba 색상 | 다수 |
| `src/app/waiting/page.tsx` | 대기 페이지 - 배경 그래디언트 | 다수 |
| `src/app/home/*` | 홈페이지 | 다수 |

#### 정의된 색상 사용 파일 (상위 10개)

| 파일명 | 주요 색상 |
|--------|---------|
| `src/lib/plan/planRouteDayColors.ts` | 프로그래매틱 (HSL→RGB) |
| `src/app/(main)/bookmark/_components/AddBookmarkModal.tsx` | COLOR_PRESETS (8가지) |
| `src/components/layout/HeaderBar.tsx` | brand-red, dark-gray, gray-border |
| `src/components/layout/SiteFooter.tsx` | brand-red |
| `src/components/layout/MainPageHeader.tsx` | brand-red |
| `src/app/(main)/bookmark/_components/BookmarkPlaceRow.tsx` | 동적 색상 |
| `src/app/layout.tsx` | gray-border |
| `src/app/(main)/plan/_components/itinerary/PlanItinerary.tsx` | 동적 색상 |

---

## 3. 색상 시스템의 문제점

### 3.1 구조 상의 문제

1. **분산된 정의**
   - Tailwind config에 10개 색상
   - AddBookmarkModal에 8개 색상 프리셋
   - globals.css에 스크롤바 색상
   - LandingHero 등에 임의값들
   - 중앙화된 색상 관리 체계 없음

2. **CSS 변수 부재**
   - 동적 테마 변경 불가능
   - 색상 추출/재사용 어려움
   - 다크 모드 지원 어려움

3. **임의값의 과다 사용**
   - 특히 랜딩 페이지에서 심각
   - 검색 시 모든 파일 확인 필요
   - 색상 일관성 유지 어려움

4. **하드코딩된 색상값**
   - globals.css의 스크롤바 색상
   - 많은 임의값들
   - 팔레트 변경 시 전체 수정 필요

---

## 4. 색상 현황 요약표

### 4.1 정의된 색상 목록

| 색상 분류 | 색상 값 | 사용처 | 종류 |
|----------|--------|------|-----|
| **브랜드 색** | #f12d33 (빨강) | 버튼, 링크, 강조 | Tailwind (`brand-red`) |
| | #03c75a (초록) | 입력 포커스, 강조 | Tailwind (`brand-green`) |
| **중성색** | #ffffff (흰색) | 배경 | Tailwind 기본 |
| | #f1f1f1 (연한 회색) | 호버 배경 | Tailwind (`bubble-gray`) |
| | #e5e7eb (경계 회색) | 테두리 | Tailwind (`gray-border`) |
| | #6a7282 (어두운 회색) | 텍스트 보조 | Tailwind (`dark-gray`) |
| | #d9d9d9 (밝은 회색) | - | Tailwind (`light-gray`) |
| **특수 색** | #ebf1f5 (AI 버블) | AI 응답 말풍선 배경 | Tailwind (`ai-bubble`) |
| | #c9d4df (AI 버블 경계) | AI 응답 말풍선 테두리 | Tailwind (`ai-bubble-border`) |
| | #695656 (톤다운 갈색) | - | Tailwind (`muted-brown`) |
| **북마크 프리셋** | #EAB308 (노랑) | 북마크 폴더 | Hardcoded |
| | #14B8A6 (민트) | 북마크 폴더 | Hardcoded |
| | #F12D33 (빨강) | 북마크 폴더 (brand-red 중복) | Hardcoded |
| | #3B82F6 (파랑) | 북마크 폴더 | Hardcoded |
| | #A855F7 (보라) | 북마크 폴더 | Hardcoded |
| | #EC4899 (핑크) | 북마크 폴더 | Hardcoded |
| | #22C55E (초록) | 북마크 폴더 | Hardcoded |
| | #F97316 (주황) | 북마크 폴더 | Hardcoded |
| **임의값 (미정리)** | #211719 | 랜딩 팀 섹션 배경 | Hardcoded |
| | #ff8589 | 랜딩 텍스트 강조 | Hardcoded |
| | #99A1AF | 아이콘, 텍스트 보조 | Hardcoded |
| | #1f1f1f | 텍스트 (거의 검은색) | Hardcoded |
| | 많은 rgba 값들 | 그래디언트, 오버레이 | Hardcoded |

### 4.2 색상 사용 구조

```
글로벌 색상 체계 (tailwind.config.js)
│
├─ 중앙화된 정의
│  ├─ brand-red (#f12d33)
│  ├─ brand-green (#03c75a)
│  └─ 기타 neutral 색상들
│
├─ 정리된 사용 (✅)
│  ├─ 기본 UI 컴포넌트
│  ├─ 레이아웃
│  └─ 모달/폼
│
├─ 정리 필요한 부분 (❌)
│  ├─ 랜딩 페이지 (임의값 다수)
│  ├─ 검색/로그인 페이지
│  ├─ 스크롤바 (hardcoded)
│  └─ 기타 임의값들
│
└─ 동적 색상 (별도 관리)
   ├─ 북마크 폴더 (사용자 선택)
   ├─ 플랜 경로 (프로그래매틱)
   └─ 카테고리 (API 기반)
```

---

## 5. CSS 변수 기반 개선 가능성

현재 CSS 변수가 없어서 다음이 어려움:
- ❌ 다크 모드 지원
- ❌ 테마 동적 변경
- ❌ 색상 추상화 레벨 부재

개선 방안:
```css
:root {
  --color-brand-red: #f12d33;
  --color-brand-green: #03c75a;
  --color-dark-gray: #6a7282;
  /* ... */
}
```

---

## 6. 마이그레이션 영향도

**높음 (변경 시 주의 필요):**
- 랜딩 페이지 컴포넌트들 (8개 파일)
- 검색 페이지
- globals.css 스크롤바

**중간 (검색 후 수정):**
- 임의값 사용 컴포넌트 (5-10개 파일)
- 북마크 색상 프리셋
- 동적 색상 생성 로직

**낮음 (변경 영향 적음):**
- Tailwind 클래스 사용 컴포넌트
- 기본 UI 요소들

---

## 요약

### 현황
- ✅ Tailwind 클래스 기반 색상이 주요 사용 방식
- ✅ 기본 UI 컴포넌트는 잘 정리됨
- ❌ 랜딩/검색 페이지에 임의값 많이 산재
- ❌ CSS 변수 없음 (다크 모드 미지원)
- ❌ 색상 정의 분산 (중앙화 부재)

### 개선 우선순위
1. **즉시 수행 필요:** CSS 변수 도입
2. **중기 계획:** 임의값 정리 및 팔레트 정의
3. **장기 계획:** 북마크/플랜 색상 시스템 최적화

---

## 7. 색상 변경 영향도 분석

### 7.1 brand-red (#f12d33) 변경 영향도

**매우 높음 🔴 (즉시 영향)**

| 메트릭 | 수치 | 설명 |
|--------|------|------|
| 사용 파일 수 | 89개 | 프로젝트의 약 25-30% 파일에서 사용 |
| 사용 횟수 | 147회 | Tailwind 클래스명 기준 |
| 사용 범위 | 전사 | 모든 모듈에서 사용 (UI/기능 모두) |

**주요 사용처 (영향도 높은 순서):**

```
1️⃣ 버튼/액션 요소 (60회 이상)
   - 기본 버튼 배경색
   - 폼 제출 버튼
   - 모달 확인 버튼
   - 삭제/위험 작업 버튼
   
2️⃣ 텍스트/강조 (40회 이상)
   - 링크 텍스트
   - 에러 메시지
   - 강조 텍스트 (제목, 라벨)
   - 활성 상태 표시
   
3️⃣ 아이콘/인디케이터 (30회 이상)
   - 로딩 스피너
   - 상태 뱃지
   - 수정/삭제 아이콘
   - 활동 표시
   
4️⃣ 배경/오버레이 (15회 이상)
   - bg-brand-red/5, /10, /[0.035] 등
   - 강조 섹션 배경
   - 에러 배경
   - 호버 상태
   
5️⃣ 테두리/구분선 (10회 이상)
   - 포커스 링 (focus:ring-brand-red)
   - 선택 상태 테두리
   - 밑줄 (underline)
```

**영향받는 주요 기능:**
- ✅ 회원 관리 (가입, 로그인, 초대)
- ✅ 북마크 (폴더, 플레이스)
- ✅ 플랜 (일정, 경로, 메뉴)
- ✅ 채팅 (입력, AI 응답)
- ✅ 검색 (필터, 결과)
- ✅ 랜딩 페이지 (CTA, 강조)

**파일별 사용 현황:**

| 파일명 | 사용 횟수 | 영향도 |
|--------|---------|--------|
| `src/app/layout.tsx` | 1 | 낮음 |
| `src/app/_components/LandingHero.tsx` | 5+ | 중간 |
| `src/app/_components/LandingActionLink.tsx` | 2+ | 낮음 |
| `src/components/layout/HeaderBar.tsx` | 3+ | 높음 |
| `src/app/home/_components/*` | 8+ | 높음 |
| `src/app/(main)/bookmark/*` | 15+ | 높음 |
| `src/app/(main)/plan/*` | 20+ | 매우높음 |
| `src/components/chat/*` | 10+ | 높음 |
| 기타 모달/폼 | 30+ | 중간 |

---

### 7.2 brand-green (#03c75a) 변경 영향도

**중간 🟠**

| 메트릭 | 수치 | 설명 |
|--------|------|------|
| 사용 파일 수 | 23개 | 약 7-10% 파일에서 사용 |
| 사용 횟수 | 44회 | Tailwind 클래스명 기준 |
| 사용 범위 | 선택적 | 특정 기능/상태에만 사용 |

**주요 사용처:**

```
1️⃣ 입력/포커스 상태 (12회)
   - input:focus border 색상
   - textarea:focus 링
   - 필드 하단라인
   
2️⃣ AI/채팅 강조 (15회)
   - AI 응답 텍스트
   - AI 라벨
   - 활성 AI 상태
   
3️⃣ 긍정/성공 상태 (10회)
   - 완료 뱃지
   - 성공 메시지
   - 활성 버튼
   
4️⃣ 배경 요소 (7회)
   - 카드 썸네일 배경 (bg-brand-green/30)
   - 활성 상태 배경
```

**영향받는 주요 기능:**
- ✅ 입력 폼 (시간, 메모, 검색)
- ✅ 채팅/AI (응답, 라벨)
- ✅ 상태 표시 (활성, 완료)
- ✅ 북마크/플랜 (특정 요소)

**파일별 사용:**

| 파일명 | 사용 횟수 | 영향도 |
|--------|---------|--------|
| `src/app/(main)/plan/_components/itinerary/PlanPlaceCard.tsx` | 3+ | 중간 |
| `src/app/(main)/plan/_components/itinerary/PlanItemTimeForm.tsx` | 2+ | 중간 |
| `src/app/(main)/plan/_components/itinerary/PlanItemMemoForm.tsx` | 2+ | 중간 |
| `src/components/chat/messages/ChatMessageGroup.tsx` | 5+ | 중간 |
| `src/components/search/PlacesSearchInput.tsx` | 3+ | 낮음 |
| 기타 | 29+ | 낮음 |

---

### 7.3 직접 헥스값 사용 현황

**brand-red (#f12d33) 직접 사용: 5회**

```javascript
// src/lib/plan/planRouteDayColors.ts
const fallbackRouteStroke = "#f12d33"; // 플랜 경로 기본색

// src/app/(main)/bookmark/_components/AddBookmarkModal.tsx
COLOR_PRESETS에 "#F12D33" 포함

// 기타 하드코딩된 값들
```

**영향:** 색상 변경 시 이 값들도 함께 변경 필요

---

### 7.4 CSS 변수 적용 시 변경 범위 예시

#### ❌ 현재 상태
```javascript
// tailwind.config.js - 변경 필요
colors: {
  "brand-red": "#f12d33",  // ← 여기 수정하면
  "brand-green": "#03c75a",
}

// 147 + 44 = 191개 클래스가 자동 변경 ✅
// 하지만 5개의 직접 헥스값은 수동 변경 필요 ⚠️
```

#### ✅ CSS 변수 적용 후
```css
/* globals.css */
:root {
  --color-brand-red: #f12d33;
  --color-brand-green: #03c75a;
}

/* tailwind.config.js */
colors: {
  "brand-red": "var(--color-brand-red)",
  "brand-green": "var(--color-brand-green)",
}

/* 런타임 동적 변경 가능 */
// 다크 모드
@media (prefers-color-scheme: dark) {
  :root {
    --color-brand-red: #ff4a5a;
    --color-brand-green: #4ade80;
  }
}
```

---

## 8. 색상 변경 체크리스트

### 🔴 Red 색상 변경 시

- [ ] `tailwind.config.js` - `brand-red` 값 수정 (↓ 영향도 높음)
- [ ] `src/lib/plan/planRouteDayColors.ts` - fallbackRouteStroke 값 수정
- [ ] `src/app/(main)/bookmark/_components/AddBookmarkModal.tsx` - COLOR_PRESETS의 `#F12D33` 값 확인
- [ ] 89개 파일의 Tailwind 클래스 자동 적용 (변경 불필요)
- [ ] 버튼 관련 컴포넌트 시각 확인
- [ ] 에러/강조 메시지 시각 확인
- [ ] 로딩 스피너 색상 확인
- [ ] 랜딩 페이지 시각 일관성 확인

### 🟢 Green 색상 변경 시

- [ ] `tailwind.config.js` - `brand-green` 값 수정 (↓ 영향도 중간)
- [ ] 23개 파일의 Tailwind 클래스 자동 적용 (변경 불필요)
- [ ] 입력 필드 포커스 상태 확인
- [ ] AI/채팅 라벨 색상 확인
- [ ] 성공/완료 상태 색상 확인

### 🔧 CSS 변수 도입 시

- [ ] `src/app/globals.css` - CSS 변수 정의 추가
- [ ] `tailwind.config.js` - 색상을 CSS 변수로 참조하도록 변경
- [ ] 다크모드 CSS 변수 정의
- [ ] 모든 시각 테스트
- [ ] 테마 전환 기능 구현

---

## 9. 마이그레이션 난이도 판단

| 변경 범위 | 파일 수 | 직접 수정 | 난이도 | 예상 시간 |
|----------|--------|---------|--------|----------|
| **brand-red만** | 89 | 5 | 🟡 낮음 | 15분 |
| **brand-green만** | 23 | 0 | 🟢 매우낮음 | 5분 |
| **두 색 모두** | 100 | 5 | 🟡 낮음 | 20분 |
| **CSS 변수 도입** | ∞ | 전체 재검토 | 🔴 높음 | 2-3시간 |
| **다크모드 구현** | ∞ | 모든 색상 | 🔴 매우높음 | 1-2일 |
