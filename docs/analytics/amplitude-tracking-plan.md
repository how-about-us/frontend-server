# Amplitude 이벤트 규약

## 기준 소스

- 이벤트 이름과 속성 타입: `src/lib/analytics/track.ts`
- 버킷과 페이지 조회 타입: `src/lib/analytics/context.ts`
- 전송 경로: `src/lib/analytics/client.ts`

이 문서는 운영과 분석을 위한 설명서이며 TypeScript 타입이 실행 시점의 최종 계약이다. 제품 이벤트는 분석 동의 후 동일한 이름과 속성으로 GA4와 Amplitude에 전송된다.

## 데이터 원칙

- 이벤트 이름과 속성 이름은 `snake_case`를 사용한다.
- 검색어 원문, 채팅 메시지 원문, 사용자 이름·이메일, 여행 제목, 초대 코드, 장소 ID는 이벤트 속성으로 보내지 않는다.
- 수량과 순위는 가능한 한 아래의 고정 버킷으로 보낸다.
- `undefined`, 빈 문자열, `null` 속성은 전송 전에 제거한다.
- 새로운 이벤트나 속성을 추가할 때는 타입, 테스트, 이 문서, Amplitude Tracking Plan을 같은 변경에서 갱신한다.
- 속성 의미를 바꾸지 않는다. 의미가 달라지면 새 속성 또는 새 이벤트 이름을 사용한다.

## 제품 이벤트

| 이벤트 | 발생 조건 | 필수 속성 | 선택 속성 |
| --- | --- | --- | --- |
| `sign_up` | Google 신규 가입 흐름이 성공했을 때 | `entry_point`, `method=google` | 없음 |
| `login` | Google 기존 사용자 로그인이 성공했을 때 | `entry_point`, `method=google` | 없음 |
| `create_bookmark_folder` | 북마크 폴더 생성 요청이 성공했을 때 | 없음 | 없음 |
| `add_to_bookmark` | 장소가 하나 이상 북마크에 추가됐을 때 | 없음 | `place_category`, `source` |
| `create_plan` | 여행 계획 생성 요청이 성공했을 때 | `entry_point` | `trip_days_bucket` |
| `view_plan` | 사용자가 새로운 계획 상세를 조회했을 때 | `member_count_bucket` | `role` |
| `invite_view` | 초대 진입 페이지가 조회됐을 때 | `entry_point` | 없음 |
| `join_group` | 즉시 참가 또는 참가 승인 완료로 계획에 합류했을 때 | 없음 | `member_count_bucket`, `role` |
| `view_place` | 사용자가 새로운 장소 상세를 조회했을 때 | 없음 | `place_category`, `rank_bucket`, `source` |
| `add_to_itinerary` | 장소가 일정에 추가됐을 때 | `item_count_bucket`, `source` | `place_category` |
| `remove_from_itinerary` | 장소가 일정에서 제거됐을 때 | `item_count_bucket` | 없음 |
| `reorder_itinerary` | 드래그 앤 드롭 일정 재정렬이 반영됐을 때 | `item_count_bucket`, `method=drag_drop` | 없음 |
| `view_search_results` | 새로운 검색 결과 세대가 화면에 반영됐을 때 | `result_count_bucket`, `search_mode` | 없음 |
| `share` | 초대 링크 복사 또는 네이티브 공유가 성공했을 때 | `method` | `member_count_bucket`, `role` |
| `chat_message_sent` | 텍스트·AI·장소 채팅 전송 액션이 실행됐을 때 | `message_type` | 없음 |
| `tutorial_begin` | 사이드바 튜토리얼이 처음 시작됐을 때 | `tutorial_version=sidebar_v1` | 없음 |
| `tutorial_complete` | 사이드바 튜토리얼의 마지막 단계를 완료했을 때 | `tutorial_version=sidebar_v1` | 없음 |
| `tutorial_skip` | 사용자가 사이드바 튜토리얼을 중간에 닫았을 때 | `skip_step`, `tutorial_version=sidebar_v1` | 없음 |

## 시스템 이벤트

| 이벤트 | 발생 조건 | 필수 속성 | 선택 속성 |
| --- | --- | --- | --- |
| `page_view` | 동의 후 SPA의 정규화된 라우트가 변경됐을 때 | `page_location`, `page_path`, `page_title` | `page_referrer` |

Amplitude 기본 page view autocapture는 `page_view` 중복을 막기 위해 비활성화한다.

## 허용 값

| 속성 | 허용 값 |
| --- | --- |
| `entry_point` | `direct`, `invite` |
| `role` | `host`, `member` |
| `source` | `bookmark`, `chat`, `map`, `plan`, `search` |
| `method` (`share`) | `copy_link`, `native_share` |
| `method` (`reorder_itinerary`) | `drag_drop` |
| `message_type` | `ai`, `place`, `text` |
| `search_mode` | `map_recenter`, `text` |
| `skip_step` | `1`, `2`, `3`, `4`, `5` |
| `tutorial_version` | `sidebar_v1` |

## 버킷 정의

| 속성 | 허용 값 |
| --- | --- |
| `item_count_bucket` | `0`, `1`, `2_3`, `4_7`, `8_plus` |
| `member_count_bucket` | `0`, `1`, `2`, `3_4`, `5_plus` |
| `result_count_bucket` | `0`, `1_5`, `6_20`, `21_plus` |
| `rank_bucket` | `1_3`, `4_10`, `11_plus` |
| `trip_days_bucket` | `1`, `2_3`, `4_7`, `8_plus` |

## 검증 체크리스트

1. 이벤트 이름이 `AnalyticsEvents`에 존재하는지 확인한다.
2. 필수·선택 속성과 허용 값이 `AnalyticsEventParamsMap`과 일치하는지 확인한다.
3. 원문 콘텐츠나 직접 식별자가 속성에 포함되지 않았는지 확인한다.
4. Development 프로젝트에서 이벤트와 사용자 ID 연결을 확인한다.
5. 동일 사용자 액션에서 이벤트가 한 번만 발생하는지 확인한다.
6. 대시보드나 퍼널에서 사용하는 이벤트를 삭제·변경하기 전에 영향 범위를 확인한다.
