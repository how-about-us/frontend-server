# 우때 (Uttae)

> 채팅, 일정, 장소 검색, 지도, 북마크, AI를 한 공간에 모은 실시간 여행 협업 서비스

카카오톡으로 대화하고, 지도에서 장소를 찾고, 노션·엑셀에 일정을 따로 정리하던 여행 준비 과정을 하나의 워크스페이스로 합칩니다.

### 기술 스택

| Category      |    Technology |
| :------------ | ------------: |
| **Framework** |       Next.js |
| **Styling**   |  Tailwind CSS |
| **State**     |       Zustand |
| **Animation** | Framer Motion |
| **DataFetch** | Tanstack Query|


### 실행
npm install
npm run dev

npm run lint
npm test
npm run build


## 작업하고 PR 올리기

공통적으로 `main`에는 직접 push하지 않고, 커밋 제목은 Conventional Commits 형식으로 한국어로 작성합니다.

```
feat: 일정 공유 기능 추가
fix: 장소 검색 오류 수정
docs: 개발자 온보딩 보완
```

### 모든 저장소의 공통 브랜치 흐름

Frontend, Backend, AI Server는 모두 같은 브랜치 전략을 사용합니다.

```
일반 작업: dev에서 feature/<topic> 분기 → dev로 PR → dev에서 main으로 릴리스 PR
긴급 수정: main에서 hotfix/<topic> 분기 → main으로 PR → dev로 백머지
```

- `main` — 배포 기준 브랜치이며 직접 push하지 않습니다.
- `dev` — 기능을 통합하고 `main` 병합 전에 함께 검증하는 브랜치입니다.
- `feature/<topic>` — `dev`에서 분기하고 PR 대상도 `dev`로 지정합니다.
- `hotfix/<topic>` — `main`에서 분기하고 PR 대상은 `main`으로 지정합니다. 병합 후 `main`을 `dev`에 백머지합니다.

브랜치는 하나의 작업 단위로 짧게 유지합니다.

#### 병합 정책

| 병합 방향 | 방식 |
| :-- | :-- |
| `feature/*` → `dev` | Squash and merge |
| `dev` → `main` | Create a merge commit |
| `hotfix/*` → `main` | Create a merge commit |
| `main` → `dev` 백머지 | Create a merge commit |

- hotfix나 revert가 `main`에 먼저 반영되면 반드시 정확한 `main` 브랜치를 merge commit으로 `dev`에 백머지합니다. cherry-pick, re-squash, 동일 패치 복사는 사용하지 않습니다.
- 백머지 충돌을 해결하고 결과를 검증하기 전에는 다음 `dev` → `main` 릴리스를 병합하지 않습니다.
- Rebase merge, 공유 중인 `main`·`dev`의 이력 재작성이나 force-push, squash 완료 후 feature 브랜치 재사용은 금지합니다.
- 정책 도입 전의 기존 이력은 Frontend PR #140과 같은 과거 merge commit 예외를 포함해 그대로 보존하며, 토폴로지 정리만을 목적으로 revert하거나 재작성하지 않습니다.
