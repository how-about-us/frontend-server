# GA4 운영 체크리스트

이 문서는 우때 프런트엔드의 GA4 코드 설정과 GA 관리자 설정이 어긋나 페이지뷰가 중복되거나 식별자가 수집되는 일을 방지하기 위한 운영 기준이다.

## 코드에서 보장하는 항목

- `NEXT_PUBLIC_GA_MEASUREMENT_ID`는 `G-`로 시작하는 유효한 형식만 사용한다.
- 프로덕션에서는 사용자가 분석 쿠키를 허용한 뒤에만 gtag.js를 로드한다.
- `gtag('config', ...)`에 `send_page_view: false`를 적용해 기본 페이지뷰를 끈다.
- App Router 경로 변경마다 애플리케이션이 `page_view`를 한 번 전송한다.
- 쿼리와 해시는 `page_path`, `page_location`, `page_referrer`에서 제거한다.
- 동적 경로는 다음과 같이 낮은 카디널리티의 템플릿으로 전송한다.

| 실제 경로 | GA 전송 경로 |
| --- | --- |
| `/join/{초대코드}` | `/join/[inviteCode]` |
| `/plan/{방 ID}` | `/plan/[roomId]` |
| `/bookmark/{폴더 ID}` | `/bookmark/[folderId]` |

분석 동의를 나중에 변경하거나 철회하는 설정 화면은 이 작업의 범위가 아니며 별도 GitHub 이슈에서 추적한다.

## 배포 환경 변수

프로덕션에는 운영 데이터 스트림의 측정 ID만 설정한다.

```dotenv
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

로컬 또는 스테이징에서 DebugView를 확인할 때만 별도 테스트 데이터 스트림의 ID와 디버그 모드를 함께 설정한다.

```dotenv
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-DEBUGXXXXX
NEXT_PUBLIC_GA_DEBUG_MODE=true
```

`NEXT_PUBLIC_GA_DEBUG_MODE=true`는 프로덕션이 아니어도 분석을 활성화하고 gtag 설정에 `debug_mode: true`를 추가한다. 운영 데이터 스트림에 디버그 트래픽을 보내지 않는다.

## GA 관리자 설정

### 1. 자동 페이지뷰 끄기

관리자 → 데이터 스트림 → 웹 스트림 → 향상된 측정 → 페이지 조회의 고급 설정에서 다음 항목을 끈다.

- 페이지 로드 기반 페이지뷰
- 브라우저 기록 변경 기반 페이지뷰

코드가 수동 `page_view`를 전송하므로 둘 중 하나라도 켜져 있으면 페이지뷰가 중복될 수 있다. 설정 변경 후 실시간 보고서에서 한 번의 화면 이동에 `page_view`가 한 번만 발생하는지 확인한다.

### 2. 맞춤 측정기준 등록

아래 이벤트 파라미터를 이벤트 범위 맞춤 측정기준으로 등록한다. 이름은 팀이 읽기 쉬운 표시명을 써도 되지만 이벤트 파라미터 값은 표와 정확히 일치시킨다.

| 이벤트 파라미터 | 용도 |
| --- | --- |
| `entry_point` | 직접 진입/초대 진입 |
| `item_count_bucket` | 일정 항목 수 구간 |
| `member_count_bucket` | 참여 인원 수 구간 |
| `message_type` | 채팅 메시지 유형 |
| `method` | 로그인·공유·정렬 방식 |
| `place_category` | 장소 카테고리 |
| `rank_bucket` | 검색 결과 순위 구간 |
| `result_count_bucket` | 검색 결과 수 구간 |
| `role` | 방 역할 |
| `search_mode` | 검색 방식 |
| `source` | 기능 진입 출처 |
| `trip_days_bucket` | 여행 일수 구간 |

`user_id`는 GA의 전용 User-ID 기능으로만 사용하고 맞춤 측정기준으로 등록하지 않는다.

### 3. 주요 이벤트 지정

전환 퍼널에 직접 쓰는 다음 이벤트를 주요 이벤트로 지정한다.

- `sign_up`
- `create_plan`
- `join_group`
- `add_to_itinerary`

로그인과 조회 이벤트는 진단·퍼널 보조 지표로 유지하고, 캠페인 목적이 정해지기 전에는 주요 이벤트로 과도하게 지정하지 않는다.

### 4. 데이터 삭제 및 필터

웹 스트림의 데이터 삭제 설정에 다음 쿼리 파라미터를 등록한다. 프런트엔드 정규화가 누락되더라도 원문이 보고서에 남지 않게 하는 방어선이다.

`q`, `inviteCode`, `roomId`, `roomTitle`, `code`, `state`, `error`, `reacceptanceToken`

필터는 테스트 상태에서 실제 분류를 검증한 뒤 활성화한다.

- 개발자 트래픽: `debug_mode`가 설정된 이벤트 제외
- 내부 트래픽: 사무실·운영자 IP 규칙을 정의하고 내부 트래픽 제외

필터를 활성화하면 과거 데이터에는 소급 적용되지 않으므로 테스트 결과와 활성화 일자를 운영 기록에 남긴다.

### 5. 보관 및 개인정보 설정

- 이벤트 데이터 보관 기간을 제품 분석에 필요한 기간으로 선택하고 결정 근거·담당자·검토일을 기록한다.
- Google Signals와 광고 개인 최적화는 사용 목적, 동의 문구, 개인정보 처리방침 검토가 끝난 경우에만 활성화한다.
- 개인정보 처리방침에는 제공자, 수집 목적, User-ID 사용, 보관 기간, 국외 처리, 동의 철회 방법이 실제 운영과 일치하는지 확인한다.

## 배포 전 검증

1. 분석 쿠키가 없거나 거부 상태일 때 gtag.js 요청과 GA 이벤트가 없는지 확인한다.
2. 허용 후 첫 화면에서 `page_view`가 한 번만 발생하는지 확인한다.
3. `/search?q=secret`, `/join/secret`, `/plan/123`, `/bookmark/456`을 이동해 GA 요청에 원문 값이 없는지 확인한다.
4. 스테이징 DebugView에서 `sign_up`, `create_plan`, `join_group`, `share`, `add_to_itinerary`와 파라미터를 확인한다.
5. 개발자·내부 트래픽 필터가 운영 보고서에서 의도대로 제외되는지 확인한다.
