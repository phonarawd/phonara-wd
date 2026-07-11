# PHONARA User ↔ Admin Correspondence Matrix

> **상태:** `[x] DONE` — `p13-prep-admin-canonical-docs` (2026-07-11)  
> **Authority:** Plan §12.14 · §24.7 · §29.2 · [`ADMIN_UX_CANON.md`](SSOT/ADMIN_UX_CANON.md) §9  
> **검증 todo:** `p13-prep-admin-canonical-docs` **`[x]`**  
> **코드 pin:** `ADMIN_USER_CORRESPONDENCE_ROWS` · `ADMIN_SECTION_12_14_CANONICAL_ROUTES`

유저가 겪는 일 → operator가 처리하는 Admin 화면 **1:1** 정본.  
유저 화면에 있는 기능인데 Admin 대응이 없으면 **1인 운영 99% 자동화 FAIL**.

---

## 1. 돈 (Money)

| 유저가 하는 일 | 유저 route                 | Admin 처리            | Admin route          | Phase         |
| -------------- | -------------------------- | --------------------- | -------------------- | ------------- |
| 원화 입금 신청 | `/wallet/deposit/krw`      | 입금 확인 · 증빙 사진 | `/admin/deposits`    | P2 · E10 증빙 |
| 코인 입금      | `/wallet/deposit/crypto`   | 입금 확인             | `/admin/deposits`    | P2            |
| 상품권 입금    | `/wallet/deposit/giftcard` | 상품권 승인           | `/admin/deposits`    | P2            |
| 출금 신청      | `/wallet/withdraw/*`       | 출금 보내기·반려      | `/admin/withdrawals` | P2            |
| 잔액·내역      | `/wallet` · `/ledger`      | (자동) 예외만 큐      | `/admin/queues`      | P2            |

---

## 2. 베팅·거래

| 유저        | 유저 route  | Admin                        | Admin route     | Phase |
| ----------- | ----------- | ---------------------------- | --------------- | ----- |
| 스포츠 베팅 | `/sports/*` | 미정산 정산·마켓 중지        | `/admin/sports` | P2    |
| 카지노      | `/casino/*` | 카지노 운영 (엔진 후)        | `/admin/casino` | E6    |
| 거래        | `/trade/*`  | (자동) 청산·서킷은 ops alert | `/admin/ops`    | P2    |

---

## 3. 부업·추천·등급

| 유저      | 유저 route       | Admin                 | Admin route                             | Phase |
| --------- | ---------------- | --------------------- | --------------------------------------- | ----- |
| 추천·보상 | `/referral/*`    | 추천 정산 승인        | `/admin/earn/referrals`                 | P2    |
| 미션      | `/home/missions` | 미션 설정 (읽기→쓰기) | `/admin/earn/missions`                  | P2·E2 |
| 수동 보상 | —                | 보상 지급             | `/admin/earn/rewards`                   | P2    |
| 등급      | `/tier/me`       | 등급 현황 · 혜택 설정 | `/admin/tiers` · `/admin/tier-benefits` | P2·E6 |
| 스테이킹  | `/staking`       | 맡기기 풀 관리        | `/admin/staking`                        | P2·E6 |

---

## 4. 회원·문의·리스크

| 유저        | 유저 route                  | Admin               | Admin route      | Phase |
| ----------- | --------------------------- | ------------------- | ---------------- | ----- |
| 회원 정보   | `/account/*`                | 회원 · 이용 정지    | `/admin/users`   | P2    |
| 문의·FAQ    | `/support` · `/support/faq` | 회원 문의 처리      | `/admin/support` | E9    |
| 버그·피드백 | `/feedback`                 | (선택) 문의 큐 연동 | `/admin/support` | E9    |
| KYC·제한    | `/account/kyc`              | 이상 거래·제재      | `/admin/risk`    | P2    |

---

## 5. 시스템·감사

| 유저        | 유저 route     | Admin           | Admin route           | Phase  |
| ----------- | -------------- | --------------- | --------------------- | ------ |
| 서비스 상태 | `/status`      | 시스템 상태     | `/admin/ops`          | P2·E10 |
| 점검 화면   | `/maintenance` | 설정·점검 모드  | `/admin/settings`     | P2     |
| (내부)      | —              | 처리 기록       | `/admin/audit`        | P2     |
| (내부)      | —              | 오늘 할 일·알림 | `/` · `/admin/queues` | P2     |

---

## 6. 팀 운영 (33차)

| operator 일        | Admin route                              | Phase                                            |
| ------------------ | ---------------------------------------- | ------------------------------------------------ |
| 직원 권한 주기     | `/admin/team`                            | P13                                              |
| 직원 로그인 보안   | `/mfa/policy`                            | P3                                               |
| 알림 받기 (휴대폰) | Web Push → 처리 대기함 (`/admin/queues`) | P13 `p13-admin-ops-push` · `/admin/settings` CTA |

---

## 7. §12.14 ↔ §29.2 sync (canonical Admin routes)

Plan §12.14 표의 Admin canonical route는 본 매트릭스·초등어 메뉴와 **1:1**.  
코드 pin: `ADMIN_SECTION_12_14_CANONICAL_ROUTES`.

| §12.14 route           | 초등어 (§29.5)   | §29.2 / 비고                                 |
| ---------------------- | ---------------- | -------------------------------------------- |
| `/admin`               | 오늘 할 일       | P2 live                                      |
| `/admin/queues`        | 처리 대기함      | P2 live                                      |
| `/admin/deposits`      | 입금 확인        | P2 · E10 증빙 행                             |
| `/admin/withdrawals`   | 출금 보내기      | P2 live                                      |
| `/admin/sports`        | 스포츠 정산      | P2 live                                      |
| `/admin/users`         | 회원             | P2 live                                      |
| `/admin/risk`          | 이상 거래        | P2 live                                      |
| `/admin/earn/*`        | 부업·추천        | P2 · activity=E6                             |
| `/admin/tiers`         | 등급 현황        | P2 live                                      |
| `/admin/staking`       | 맡기기(스테이킹) | P2 read                                      |
| `/admin/audit`         | 처리 기록        | P2 · CSV=E6                                  |
| `/admin/settings`      | 설정             | P2 live                                      |
| `/admin/ops`           | 시스템 상태      | P2 live                                      |
| `/admin/team`          | 직원 권한        | **P13** `p13-prep-admin-team-desk` **`[x]`** |
| `/admin/support`       | 회원 문의        | **E9** `ew-e9-page-admin-support` **`[x]`**  |
| `/admin/earn/activity` | 회원 활동 보기   | **E6**                                       |

---

## 8. 갭 추적 (Plan YAML)

| Admin route                                          | 상태    | todo                                           |
| ---------------------------------------------------- | ------- | ---------------------------------------------- |
| `/admin/team`                                        | wired   | `p13-prep-admin-team-desk` **`[x]`**           |
| ops Web Push (settings CTA → `/queues`)              | wired   | `p13-admin-ops-push` **`[x]`**                 |
| `/admin/support`                                     | wired   | `ew-e9-page-admin-support` **`[x]`**           |
| `/admin/earn/activity`                               | planned | `ew-e6-page-admin-earn-activity`               |
| `/admin/audit` CSV                                   | planned | `ew-e6-page-admin-audit-export`                |
| deposits 증빙                                        | wired   | `ew-e10-page-admin-krw-proof-review` **`[x]`** |
| `/admin/promotions` · `/admin/cms` · `/admin/casino` | E-Wave  | `ew-e6-*`                                      |

---

## 교차 참조

- Plan §12.14 · §29.2 · §29.5 · §32.6
- [`ADMIN_BEGINNER_LANGUAGE_CANON.md`](SSOT/ADMIN_BEGINNER_LANGUAGE_CANON.md)
- [`ADMIN_TEAM_RBAC_CANON.md`](SSOT/ADMIN_TEAM_RBAC_CANON.md)
