# 기여 가이드

이 문서는 브랜치 생성, Pull Request(PR), 병합 정책의 상세 기준입니다.

## 브랜치와 PR

- `main`은 배포 기준 브랜치입니다. 직접 push하지 않고 모든 변경을 PR로 병합합니다.
- `dev`는 기능을 통합하고 릴리스 전에 함께 검증하는 브랜치입니다.
- 일반 작업은 최신 `dev`에서 `feature/<topic>` 브랜치를 만들고 `dev`를 대상으로 PR을 엽니다. 브랜치는 하나의 작업 단위로 짧게 유지하며, squash 병합이 끝난 feature 브랜치는 다시 사용하지 않습니다.
- 긴급 수정은 최신 `main`에서 `hotfix/<topic>` 브랜치를 만들고 `main`을 대상으로 PR을 엽니다.

## 병합 정책

| 병합 방향 | 방식 |
| :-- | :-- |
| `feature/*` → `dev` | Squash and merge |
| `dev` → `main` | Create a merge commit |
| `hotfix/*` → `main` | Create a merge commit |
| `main` → `dev` 백머지 | Create a merge commit |

- hotfix나 revert가 `main`에 먼저 반영되면 최신 `main`의 정확한 HEAD를 merge commit으로 `dev`에 백머지합니다. cherry-pick, re-squash 또는 동일한 패치를 다시 적용하는 방식으로 전달하지 않습니다.
- 백머지 충돌을 해결하고 결과를 검증하기 전에는 다음 `dev` → `main` 릴리스를 병합하지 않습니다.
- Rebase merge는 사용하지 않습니다.
- 공유 중인 `main`과 `dev`의 이력을 재작성하거나 force-push하지 않습니다.
- 정책 도입 전의 기존 이력과 merge commit은 역사적 예외로 그대로 보존합니다. 토폴로지를 정리할 목적만으로 revert하거나 이력을 재작성하지 않습니다.

## 병합 검증

병합 전에는 다음 항목을 확인합니다.

- 대상(base)과 소스(head)의 정확한 SHA
- 병합 방향에 맞는 병합 방식
- PR의 최종 diff와 merge 가능 여부
- 필수 checks 통과 여부와 필요한 approval 완료 여부

head나 base가 변경되면 위 항목을 모두 다시 확인합니다.

병합 후에는 결과 커밋을 다시 확인합니다. Squash 병합은 생성된 squash 커밋의 부모가 병합 직전 base인지, 최종 diff가 예상과 같은지, squash 커밋이 대상 브랜치의 ancestry에 포함되는지 확인합니다. Merge commit은 두 부모가 병합 직전 base와 정확한 head인지, merge commit과 head가 대상 브랜치의 ancestry에 포함되는지 검증합니다.
