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

커밋 제목은 Conventional Commits 형식으로 한국어로 작성합니다.

```
feat: 일정 공유 기능 추가
fix: 장소 검색 오류 수정
docs: 개발자 온보딩 보완
```

### 모든 저장소의 공통 브랜치 흐름

Frontend, Backend, AI Server는 모두 같은 브랜치 전략을 사용합니다.

- `feature/*` → `dev`: Squash and merge
- `dev` → `main`: Create a merge commit
- `hotfix/*` → `main`: Create a merge commit
- `main` → `dev` 백머지: Create a merge commit

자세한 브랜치 생성, PR, 병합 정책은 [CONTRIBUTING.md](./CONTRIBUTING.md)를 따릅니다.
