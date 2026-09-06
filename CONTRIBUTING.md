# 기여 가이드

이 문서는 커밋, 브랜치 생성, Pull Request(PR), 병합 정책의 상세 기준입니다.

## 작업하고 PR 올리기

커밋 제목은 Conventional Commits 형식으로 한국어로 작성합니다.

```
feat: 일정 공유 기능 추가
fix: 장소 검색 오류 수정
docs: 개발자 온보딩 보완
```

- `main`은 배포 기준 브랜치입니다. 직접 push하지 않고 모든 변경을 PR로 병합합니다.
- `dev`는 기능을 통합하고 릴리스 전에 함께 검증하는 브랜치입니다.
- 일반 작업은 최신 `dev`에서 `feature/<topic>` 브랜치를 만들고 `dev`를 대상으로 PR을 엽니다. 브랜치는 하나의 작업 단위로 짧게 유지하며, squash 병합이 끝난 feature 브랜치는 다시 사용하지 않습니다.
- 긴급 수정은 최신 `main`에서 `hotfix/<topic>` 브랜치를 만들고 `main`을 대상으로 PR을 엽니다.

## 공통 브랜치 흐름

브랜치 병합에는 다음 공통 흐름을 적용합니다.

| 병합 방향 | 방식 |
| :-- | :-- |
| `feature/*` → `dev` | Squash and merge |
| `dev` → `main` | Create a merge commit |
| `hotfix/*` → `main` | Squash and merge |
| `main` → `dev` 백머지 | Create a merge commit |

- hotfix나 revert가 `main`에 먼저 반영되면 최신 `main`의 정확한 HEAD를 merge commit으로 `dev`에 백머지합니다. cherry-pick, re-squash 또는 동일한 패치를 다시 적용하는 방식으로 전달하지 않습니다.
- 백머지 충돌을 해결하고 결과를 검증하기 전에는 다음 `dev` → `main` 릴리스를 병합하지 않습니다.
- Rebase merge는 사용하지 않습니다.
- 공유 중인 `main`과 `dev`의 이력을 재작성하거나 force-push하지 않습니다.
- 정책 도입 전의 기존 이력과 merge commit은 역사적 예외로 그대로 보존합니다. 토폴로지를 정리할 목적만으로 revert하거나 이력을 재작성하지 않습니다.

## Pull Request Rules
- PR 제목은 커밋 컨벤션과 동일한 형식(feat: ...)을 따른다.
- main으로 직접 merge 전 최소 1명의 리뷰가 필요하다.
- PR 본문은 .github/pull_request_template.md 형식을 그대로 따른다.
- PR 본문에 변경 이유와 테스트 방법을 간략히 적는다.
