# Admin Beginner Language Canon (33차)

> **상태:** `[x] DONE` — `p13-prep-admin-canonical-docs` (2026-07-11)  
> **Authority:** Plan §29.1 · §29.5 · [`ADMIN_UX_CANON.md`](ADMIN_UX_CANON.md)  
> **코드:** `apps/admin/src/domain/admin-beginner-language-display-contract.ts`  
> **검증 todo:** `p13-prep-admin-canonical-docs` **`[x]`**

프로그래밍·금융 지식이 없는 operator가 **메뉴 이름만 보고** 무엇을 하는 화면인지 알 수 있게 하는 Admin 전용 언어 정본입니다.  
목표 독자 = **초등학생도 이해할 수 있는 짧은 한국어** (내부 RPC명·영어 업무어 화면 노출 0).

---

## 1. 핵심 규칙

| #   | 규칙                                                                             |
| --- | -------------------------------------------------------------------------------- |
| 1   | 메뉴·버튼 = **동사 + 대상** (4~8글자 목표)                                       |
| 2   | 영어·약어·내부명 화면 **0** (queue, desk, RPC, void, settle, flag, audit log 등) |
| 3   | 같은 뜻 = 같은 말 — §29.1 용어 사전과 **1:1**                                    |
| 4   | `admin.help.{desk}` = 3문장 이하 — 「언제」「무엇」「끝나면」                    |
| 5   | 에러 = 「무슨 일 + 지금 할 일」 2문장 (`admin.error.*`)                          |

---

## 2. 메뉴 초등어 정본 (ko · `admin.nav.*`)

| Route             | 라벨 (ko)        | 도움말 한 줄                   |
| ----------------- | ---------------- | ------------------------------ |
| `/` (overview)    | 오늘 할 일       | 시스템이 찾아준 일만 보면 돼요 |
| `/queues`         | 처리 대기함      | 아직 끝나지 않은 일 모음       |
| `/deposits`       | 입금 확인        | 회원이 넣은 돈이 맞는지 봐요   |
| `/withdrawals`    | 출금 보내기      | 회원에게 돈을 보낼 때 눌러요   |
| `/sports`         | 스포츠 정산      | 경기 끝나고 당첨금 맞추기      |
| `/users`          | 회원             | 회원 찾기·이용 정지            |
| `/risk`           | 이상 거래        | 수상한 거래 표시·해제          |
| `/earn`           | 부업·추천        | 추천·미션·보상 모음            |
| `/earn/referrals` | 추천 정산        | 친구 추천 보상 확인            |
| `/earn/missions`  | 미션 설정        | 미션 켜기·끄기 (엔진 후)       |
| `/earn/rewards`   | 보상 지급        | 수동으로 포인트 주기·빼기      |
| `/earn/activity`  | 회원 활동 보기   | 회원이 얼마나 썼는지 숫자      |
| `/viral-stats`    | 바이럴 통계      | 추천·공유 숫자                 |
| `/tiers`          | 등급 현황        | 회원 등급 숫자만 봐요          |
| `/staking`        | 맡기기(스테이킹) | 맡긴 돈 풀 켜기·끄기           |
| `/audit`          | 처리 기록        | 누가 무엇을 했는지 기록        |
| `/settings`       | 설정             | 기능 켜기·알림 기준            |
| `/ops`            | 시스템 상태      | 서버·작업 건강 확인            |
| `/mfa/policy`     | 로그인 보안      | 직원 2단계 인증 규칙           |
| `/team`           | 직원 권한        | 직원에게 볼 수 있는 메뉴 주기  |
| `/support`        | 회원 문의        | 회원이 보낸 질문 답하기        |

---

## 3. §29.1 용어 사전 (화면 단어 = 이 표만)

| 왕초보 정본 (ko) | 내부 개념 | 금지 혼용어 |
| ---------------- | --------- | ----------- |
| 입금 확인 | deposit match/approve | 충전 · 머니인 · 매칭 |
| 출금 보내기 | withdrawal approve+send | 환전 · 머니아웃 |
| 반려 (사유 필수) | reject | 거절 · 거부 · 취소 혼용 |
| 보류 | hold/halt | 정지·중단 혼용 |
| 이상 거래 | flag | 플래그 |
| 처리 대기 | pending queue item | 펜딩 · 큐 |
| 확인 중 | reviewing | 리뷰 · 검토중 혼용 |
| 완료 | settled/done | 승인됨 혼용 |
| 실패 | failed | 에러 |
| 미정산 경기 | unsettled fixture | 언세틀 |
| 경기 정산하기 | manual settle | 세틀 |
| 마켓 중지 | suspend market | 서스펜드 |
| 베팅 무효 처리 | void | 보이드 |
| 수동 지급·차감 | manual wallet adjust | 어드저스트 |
| 추천 정산 승인 | affiliate commission approve | 커미션 |
| 감사 기록 | audit log | 로그 |
| 기능 켜기/끄기 | feature enable | 토글 |
| 점검 모드 | system mode | 메인터넌스 |
| 이용 정지/해제 | user activity set | 밴 · 블락 |
| 자기제한 해제 | self-exclusion release | RG 해제 |
| 위험 표시 해제 | clear risk flag | — |
| 상품권 수수료 시세 | giftcard fee market | 피마켓 |
| 사유 | reason (≥4자) | 메모 혼용 |
| 오늘 할 일 | ops dashboard summary | 대시보드 |

**상태 6종 (StatusBadge · 유저앱과 동일):** 대기중 · 확인중 · 완료 · 실패 · 반려 · 보류

고위험 버튼(R3) 모달 고정 문구: **「이 작업은 되돌릴 수 없어요」**

---

## 4. 금지 화면 단어 (grep FAIL)

`queue` · `desk` · `ops`(메뉴 대신 「시스템 상태」) · `settle` · `void` · `flag` · `RPC` · `audit log` · `pending`(단독) · `review` · `compliance` · `AML` · `KYC`(설정 설명 말고 메뉴에)

---

## 5. 완료 신호

- [x] `admin-beginner-language-display-contract` test green (`p13-prep-admin-canonical-docs`)
- [x] SSOT 3종 + display contract **동일 PR** (50차 merge)
- [x] §12.14 ↔ §29.2 planned desks (`/admin/team` · `/support` · `/earn/activity`) pin
- [x] `rg` 금지어 admin product surfaces 0 (soft-launch spot-check) — `p13-soft-launch-admin-spotcheck` 2026-07-11
- [ ] 모든 P2+ desk에 `admin.help.*` 3줄 (desk UI wire)
- [x] `p13-soft-launch-bundle` operator 초등어 spot-check — **`[x]`** 2026-07-11

---

## 교차 참조

- [`ADMIN_TEAM_RBAC_CANON.md`](ADMIN_TEAM_RBAC_CANON.md) — 역할별 메뉴
- [`PHONARA_USER_ADMIN_CORRESPONDENCE_MATRIX.md`](../PHONARA_USER_ADMIN_CORRESPONDENCE_MATRIX.md) — 유저 화면 ↔ Admin 데스크
- Plan §29.1–29.5 · §12.14 · §32.6
- Soft Launch: [`P13_SOFT_LAUNCH_BUNDLE.md`](../OPERATIONS/P13_SOFT_LAUNCH_BUNDLE.md) · W7 strict `#234` **`[x]`** · DA W7 VISUAL `#235` agent impl **`[x]`** · **다음** `p13-closeout-bundle` (#236)

