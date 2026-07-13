# PHONARA Zero Assumption 전수 분석 — 통합 감사

> **감사일:** 2026-07-13 · **모드:** READ-ONLY (코드/migration 수정 0 — 순수 기록)
> **작업 방식:** 기존 감사 자산 재사용(표본 스팟체크) + 코드 레벨 격차만 신규 검증 (operator 승인 방식)
> **작성 순서:** PART 1 (1-A → 1-F) 항목별 완료 시 보고 → PART 2는 PART 1 전체 완료 후 착수

## 0. 재사용 선언 — 이미 존재하는 Zero Assumption 감사 자산

착수 전 `git status` + 문서 탐색으로 아래 4종이 오늘(2026-07-13) 날짜로 이미 존재함을 확인했다. 이 문서는 이들을 **재사용**하고, 이들이 다루지 않은 **코드 레벨 격차만** 신규로 추가한다.

| 문서                                                                                                                                                                                | 역할                                                                                                          | 본 문서에서의 취급                                              |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| [`PLATFORM_AUDIT_REFERENCE.md`](PLATFORM_AUDIT_REFERENCE.md) (484줄)                                                                                                                | "PHONARA 전체 플랫폼 Zero Assumption Audit — 참고 정본"                                                       | 인용, 재도출 안 함                                              |
| [`PLATFORM_AUDIT_FINDING_REGISTRY.yaml`](../OPERATIONS/PLATFORM_AUDIT_FINDING_REGISTRY.yaml) (38 findings)                                                                          | 구조화 결함 등록부                                                                                            | 인용                                                            |
| [`MASTER_INVENTORY_AUDIT_2026-07-13.md`](MASTER_INVENTORY_AUDIT_2026-07-13.md) + `PER_PAGE_UI_MATRIX.md` / `RPC_USAGE_MATRIX.md` / `REPO_TREE_APPENDIX` / `KNIP_DEADCODE_REPORT.md` | 라우트·페이지·RPC·DB 전수 인벤토리                                                                            | 인용 + 표본 스팟체크                                            |
| [`SYSTEM_AUDIT_2026-07-13/`](SYSTEM_AUDIT_2026-07-13/) 00~07 + FINDINGS.yaml                                                                                                        | 7-Pillar 재점수 (Repository 86·DB 82·Frontend 78·Backend 85·Security 84·Performance 58·Release 38) + SA-01~06 | 인용, 신규 finding은 이 registry와 중복되지 않게 `ZA-*` id 부여 |

**신규 finding ID 규칙:** 본 문서의 신규 발견은 `ZA-01`부터 번호를 매기며, 기존 `SA-*`/Registry id와 충돌하지 않는다. 기존 finding을 재확인만 한 경우 "(기존 SA-xx 재확인)"으로 표기한다.

---

# PART 1 — 현황 진단

## 1-A. 전체 인벤토리 + 문서 대조 불일치표

### 1-A.1 인벤토리 재사용 (스팟체크 결과)

`MASTER_INVENTORY_AUDIT_2026-07-13.md` §1~§23의 수치를 표본 재확인했다. 방법: `Get-ChildItem`/Glob 직접 재계수 + `package.json` 직접 열람 (문서 신뢰 안 함).

| 항목                                                                                        | 문서 기재값                                                                                        | 직접 재측정                                                                                                                                                                | 판정                         |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Web route 파일 (`apps/web/src/routes/**/*.tsx`)                                             | 93                                                                                                 | **93**                                                                                                                                                                     | ✅ 일치                      |
| Web page 파일 (`*-page.tsx`)                                                                | 77                                                                                                 | **77**                                                                                                                                                                     | ✅ 일치                      |
| Web shell 파일 (`*-shell.tsx`)                                                              | 2                                                                                                  | **2**                                                                                                                                                                      | ✅ 일치                      |
| Admin route 파일                                                                            | 34                                                                                                 | **34**                                                                                                                                                                     | ✅ 일치                      |
| SQL 통합 테스트 (`supabase/tests/*.sql`)                                                    | 142                                                                                                | **142**                                                                                                                                                                    | ✅ 일치                      |
| React / Vite / TanStack Router / Tailwind / TypeScript / Zustand / Vitest / Playwright 버전 | React 19.2.7 · Vite 8 · Router ~1.170 · Tailwind 4 · TS 6 · Zustand 5 · Vitest 4 · Playwright 1.60 | `package.json` 직접 대조 — **전부 일치** (`apps/web/package.json`: react 19.2.7, `@tanstack/react-router` ^1.170.15, tailwindcss ^4.3.1, typescript 6.0.3, zustand 5.0.14) | ✅ 일치                      |
| Admin page 파일 (`admin-*-page.tsx`)                                                        | **32**                                                                                             | **29** (정밀 재계수, `__tests__`·dialog·shell 컴포넌트 3종 제외)                                                                                                           | ⚠️ **불일치 — 원인 미확인**  |
| DB migration 파일 (`supabase/migrations/*.sql`)                                             | 239 (Phase 1) → **241** (같은 날 Pillar 2 재측정)                                                  | **243** (본 감사 재측정)                                                                                                                                                   | ⚠️ **불일치 — 계속 증가 중** |

**해석:**

- 대부분의 정량 수치는 신뢰할 수 있음이 확인됨 — MASTER_INVENTORY를 그대로 재사용하는 결정이 타당했음을 뒷받침.
- **admin 페이지 32 vs 29**: 정확한 집계 방식 차이인지 실제 파일 삭제/통합 때문인지 **확인 필요(UNVERIFIED)**. 근거: `apps/admin/src/product/surfaces/admin-*-page.tsx` 정밀 카운트 29개 (파일 목록 전수 확인, `__tests__/*.test.tsx` 4개·`admin-alert-action-dialog.tsx`·`admin-sports-settle-dialog.tsx`·`admin-queue-action-dialog.tsx`·`admin-forbidden-shell.tsx` 제외).
- **migration 239→241→243**: **같은 날 세 번 측정할 때마다 숫자가 올라갔다.** 이는 우연이 아니라 Freeze ACTIVE 기간 중 워킹트리에 migration이 계속 추가되고 있다는 직접 증거다. 실제로 `supabase/migrations/20260823000001_platform_sql_ci_closeout2.sql`, `20260824000001_platform_sql_ci_closeout3.sql`, `20260825000001_platform_sql_ci_closeout4.sql` 3개 파일이 오늘 날짜로 디스크에 존재함을 직접 확인했다. 기존 `SA-01` finding(Pillar 2)은 "closeout·closeout2 2건 미적용"만 언급했는데, 실제로는 **closeout3·closeout4까지 추가되어 SA-01이 기록한 시점보다 상황이 더 진행됨**.

**Finding ZA-01 (SA-01 확장·MEDIUM):** Freeze ACTIVE 중 SQL CI closeout migration이 `closeout`→`closeout2`→`closeout3`→`closeout4`로 계속 늘어나고 있으며, 기존 SA-01 문서가 인용하는 "2건"보다 실제 미적용 후보가 더 많다. 근거: 파일시스템 직접 열람 (`supabase/migrations/2026082*.sql`, `2026083*.sql` glob), `docs/audit/SYSTEM_AUDIT_2026-07-13/02_DATABASE.md` §1 (241 기준 SA-01). **심각도: P2** — 데이터 안전성 자체는 위협하지 않으나(로컬 게이트 통과 전제), Freeze 거버넌스 위반이 매 세션 누적되고 있어 RC SHA 재산정 필요성이 SA-01 작성 시점보다 커짐.

### 1-A.2 백엔드 API — 도메인별 핸들러 (신규: 기존 매트릭스는 평면 알파벳순만 제공)

`RPC_USAGE_MATRIX.md`(256개 `rpc_*`)는 알파벳순 평면 목록만 제공하고 Trading/Wallet/Casino/Sports/Mission/Admin 도메인 그룹핑이 없다. 함수명·호출 파일 경로를 근거로 도메인별로 재분류했다:

| 도메인                                                              | 근사 개수 | 대표 함수                                                                                                |
| ------------------------------------------------------------------- | --------: | -------------------------------------------------------------------------------------------------------- |
| Admin (`rpc_admin_*` 정확 카운트)                                   |    **35** | `rpc_admin_halt_market`, `rpc_admin_review_krw_deposit_proof`, `rpc_admin_set_role_grant`                |
| Platform/Service 내부 (`rpc_service_*` 정확 카운트, edge·cron 전용) |    **19** | `rpc_service_ingest_usdt_krw_rate`, `rpc_service_record_edge_ops_event`                                  |
| Earn/Mission/Referral/Tier/Staking                                  |       ~38 | `rpc_get_earn_hub_status`, `rpc_claim_repeatable_mission`, `rpc_get_tier_decay_status`, `rpc_stake_phon` |
| Trading (Spot/Futures/Margin/Oracle)                                |       ~34 | `rpc_open_futures_position`, `rpc_place_spot_limit_order`, `rpc_run_liquidations`                        |
| Sports                                                              |       ~29 | `rpc_place_sports_bet`, `rpc_settle_sports_fixture`, `rpc_cashout_sports_bet`                            |
| Wallet/Ledger/Payments                                              |       ~23 | `rpc_request_withdrawal`, `rpc_create_krw_deposit_request`, `rpc_transfer_to_user`                       |
| Casino (게임/PF)                                                    |       ~20 | `rpc_place_game_bet`, `rpc_live_crash_place_bet`, `rpc_reveal_game_round`                                |
| Identity/Auth/Compliance/RG                                         |        ~9 | `rpc_submit_kyc`, `rpc_set_self_exclusion`, `rpc_record_consent`                                         |
| Platform/Ops/Marketing/CMS (비-admin·비-service)                    |       ~15 | `rpc_list_cms_content`, `rpc_run_reconciliation`, `rpc_get_public_platform_status`                       |

**UNVERIFIED (명시):** Admin(35)·Service(19) 두 버킷은 접두어가 명확해 정확하지만, 나머지 6개 도메인 합계(~168)는 함수명 키워드 기반 수동 분류로 **경계 사례가 존재**한다. 예: `rpc_stake`/`rpc_stake_phon`(Earn 스테이킹 개념이지만 실제 코드는 `trading-rpc-display-contract.ts`에 위치), `rpc_spin_roulette`(Earn 일일 룰렛, `earn-play-page-controller.ts` 호출)와 `rpc_reveal_roulette_spin`(Casino PF 룰렛 게임)처럼 **이름이 비슷하지만 다른 도메인**인 쌍이 존재해 총합이 256과 정확히 일치하지 않을 수 있다. 정밀 태깅은 스크립트화가 필요하며 본 감사는 근사치임을 명시한다.

**Finding ZA-02 (LOW):** RPC 명명 규칙이 도메인을 항상 명확히 구분하지 않음(`stake`/`roulette` 계열 이름 중복). 근거: 위 표 + `RPC_USAGE_MATRIX.md` 호출 사이트 열. **심각도: P3** — 기능 결함은 아니나 신규 RPC 命名 시 혼동 유발 가능.

### 1-A.3 README / 상태 문서 vs 실제 코드 불일치표 (신규)

| 문서                                                                                  | 기재 내용                                                                                                                                                                                                                                                | 실제 코드/SSOT 상태                                                                                                                                                                                                                                                                                                                                                                                                                           | 불일치                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`README.md`](../../README.md) (루트, 15줄)                                           | "PHONARA GB master repository" + "Phase D (Demolition)" 섹션만. 아키텍처·기술스택·설치법 설명 0줄                                                                                                                                                        | 실제로는 Demolition **DONE**, Engine Apex **FULLY CLOSED**, Phase R UI Rebuild가 280개 항목 중 273개 완료(`§AI Todo Sync`), Release Candidate가 Freeze 상태로 3-Owner 서명 대기 중인 **성숙한 플랫폼**                                                                                                                                                                                                                                        | 새 기여자/외부 감사자가 README만 읽으면 "삭제 작업 중인 초기 저장소"로 오인함. 기술스택·아키텍처 설명이 전혀 없어 `MASTER_INVENTORY_AUDIT`가 실질적 README 역할을 대신하고 있음                                           |
| [`docs/CURRENT_STATUS.md`](../CURRENT_STATUS.md) (README 링크 텍스트 자체가 "(stub)") | 2026-07-10 날짜 고정, §AI Todo Sync 표에 `p2-defer-admin-tier-benefits`·`p2-defer-admin-promotions`·`p2-defer-admin-cms`·`p2-defer-admin-casino`·`p2-defer-admin-staking`·`p2-defer-admin-support` 전부 **"`[x]` cancelled · DEFER — 구현 금지"**로 표기 | 위 6개 admin 페이지 중 5개(tier-benefits·promotions·cms·casino·staking)를 직접 열람한 결과 **전부 실제 구현되어 있음** — `admin-casino-page.tsx`(138줄, `useAdminCasinoDesk` 훅 실연결), `admin-staking-page.tsx`(240줄+), `admin-tier-benefits-page.tsx`(77줄+), 전부 실 RPC 연동·`AdminTable`·`HowItWorks` 완비. `admin-support-page.tsx`도 `apps/admin/AGENTS.md`에 "E9 UI (`ew-e9-page-admin-support`)"로 명시적으로 문서화되어 실존 확인 | **"구현 금지"라고 적힌 기능이 실제로는 구현되어 운영 중.** 나중에(E6/E9 admin desks wave, `ew-e6-admin-desks-wave` #250 등) 같은 기능이 다시 만들어졌는데 CURRENT_STATUS.md의 원래 "defer/cancelled" 표기가 갱신되지 않음 |
| `docs/CURRENT_STATUS.md` 날짜                                                         | 2026-07-10                                                                                                                                                                                                                                               | `SYSTEM_AUDIT_2026-07-13`·`ACTIVE_WORK_SSOT` 등은 2026-07-13                                                                                                                                                                                                                                                                                                                                                                                  | 3일 정체 — README가 가리키는 "현재 상태" 문서가 실제로는 최신이 아님                                                                                                                                                      |

**Finding ZA-03 (문서 신뢰성 — P2):** `docs/CURRENT_STATUS.md`의 admin 6개 서피스 "cancelled/구현 금지" 표기가 이후 완료된 E6/E9 admin desk 구현과 충돌한다. 이 문서만 보고 "해당 admin 기능은 없다"고 판단하면 실제로 존재하는 기능을 중복 구현하거나, 반대로 실제 운영 중인 기능을 "금지된 것"으로 오인해 건드리지 않아야 할 코드를 방치할 위험이 있다. 근거: `docs/CURRENT_STATUS.md:370-376` vs `apps/admin/src/product/surfaces/admin-casino-page.tsx`·`admin-staking-page.tsx`·`admin-tier-benefits-page.tsx` 실제 코드, `apps/admin/AGENTS.md` E9 섹션. **권장(실행은 다음 단계):** §82 doc sync 규칙에 따라 CURRENT_STATUS.md의 해당 6행에 "이후 E6/E9 wave에서 구현됨 — 아래 참조" 각주 추가.

**Finding ZA-04 (LOW):** `README.md`에 프로젝트 설명·아키텍처·기술스택이 전혀 없어(Phase D 스텁 상태로 고정) 신규 인원 온보딩 시 `MASTER_INVENTORY_AUDIT_2026-07-13.md`를 찾아야만 실제 구조를 파악할 수 있음. **심각도: P3.**

### 1-A.4 DB 테이블 실사용 매핑 — 범위 축소 (명시)

`PLATFORM_AUDIT_REFERENCE.md` §9.1은 136개 테이블·RLS 137/137·정책 248개를 이미 확인했다. 136개 테이블 각각에 대해 "어떤 코드가 참조하는지"를 전수 재매핑하는 작업은 본 감사에서 **수행하지 않는다** — 프론트엔드가 테이블을 직접 참조하는 경로는 RLS로 제한되어 있고 주 접근 경로가 RPC 계층(위 1-A.2)이기 때문에, 전수 테이블 매핑보다 RPC 계층 분석이 더 높은 신호 대 잡음비를 가진다고 판단했다. **NOT VERIFIED로 명시**하며, 1-F에서 Wallet/Ledger 핵심 테이블만 표본으로 코드 직접 판독한다.

---

## 1-B. 중복/누락/불일치 전수조사

### 1-B.1 동일 기능의 두 API 경로 — `callRpc` 우회 전수 스캔 (일반화)

기존 발견(1-A 이전 조사)에서 `tier-me-page`는 타입세이프 `callRpc()`를, `earn-home-page`는 `supabase.rpc()`를 직접 호출한다는 사례 하나를 확인했다. `apps/web/src/features/**`, `apps/web/src/hooks/**`를 전수 grep한 결과, 이것은 **2개 페이지의 우연한 차이가 아니라 25개 파일에 퍼진 구조적 패턴**이었다.

| 그룹                                                                                                                                                  | `callRpc` 우회 파일 수 | 목록                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `features/earn/*`                                                                                                                                     |                 **15** | `use-earn-home-page-controller` · `use-tier-benefits-page-controller` · `use-tier-guide-page-controller` · `use-staking-page-controller` · `use-referral-page-controller` · `use-referral-invite-page-controller` · `use-share-earnings-page-controller` · `use-home-attendance-page-controller` · `use-home-missions-page-controller` · `use-home-missions-invite-page-controller` · `use-home-missions-referral-page-controller` · `use-earn-play-page-controller` · `use-earn-cashback-page-controller` · `use-events-hub-page-controller` · `use-viral-missions` |
| `features/wallet/earn-hub-tier.ts` · `features/trading/use-trade-earn-vip-tier.ts` · `features/onboarding/use-onboarding-missions-page-controller.ts` |                  **3** | 폴더는 wallet/trading/onboarding이지만 실제로는 Earn Hub 데이터를 재조회하는 헬퍼                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `features/account/*`                                                                                                                                  |                      2 | `use-account-hub-controller` · `use-account-profile-controller` (둘 다 `rpc_get_earn_hub_status` 직접 호출)                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `features/wallet/use-crypto-deposit.ts` · `features/notifications/web-push-subscription.ts`                                                           |                      2 | Earn과 무관                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `hooks/*`                                                                                                                                             |                      3 | `use-compliance-status` · `use-client-gate-prechecks` · `use-trading`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **합계**                                                                                                                                              |                 **25** | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

**Earn 도메인 관련 파일: 25개 중 18개 (72%)** — 사용자가 제시한 P0 판정 기준(Earn 관련 훅 비율)에 따라 이 패턴은 **P0**로 분류한다.

**핵심 서브 발견 — 같은 RPC가 4개의 다른 이름으로 재수출됨:**

`unified-tier-display-contract.ts`에 `EARN_HUB_STATUS_RPC = 'rpc_get_earn_hub_status'`가 정의되어 있는데, 이를 그대로 재수출한 상수가 3개 더 있다:

```12:16:apps/web/src/domain/tier-fee-display-contract.ts
export const TIER_FEE_EARN_HUB_RPC = EARN_HUB_STATUS_RPC;
```

- `EARN_PLAY_HUB_STATUS_RPC` (`earn-play-display-contract.ts:15`) = `EARN_HUB_STATUS_RPC`
- `EARN_CASHBACK_HUB_STATUS_RPC` (`earn-cashback-display-contract.ts:20`) = `EARN_HUB_STATUS_RPC`
- `TIER_FEE_EARN_HUB_RPC` (`tier-fee-display-contract.ts:16`) = `EARN_HUB_STATUS_RPC`

즉 `rpc_get_earn_hub_status` **하나의 RPC**를 `use-earn-home-page-controller`(원시 문자열) · `use-tier-me-page-controller`(`callRpc`) · `use-tier-benefits-page-controller`(원시 문자열) · `use-earn-cashback-page-controller`(`EARN_CASHBACK_HUB_STATUS_RPC`) 등 최소 13개 이상의 서로 다른 파일이 각자 다른 이름/방식으로 호출한다. (참고: `EVENTS_HUB_STATUS_RPC`는 이름이 비슷해 보이지만 실제로는 `GOLDEN_EARTH_STATUS_RPC`를 가리키는 **다른** RPC — 혼동하지 않도록 확인함.)

**Finding ZA-05 (P0):** Earn 도메인 15개 이상의 컨트롤러가 핵심 RPC(`rpc_get_earn_hub_status`)를 `callRpc()` 타입세이프 래퍼 없이 직접 호출하며, 동일 RPC를 가리키는 상수가 4개 이름으로 중복 재수출되어 있다. 근거: 위 grep 결과 25개 파일 + 4개 상수 정의 파일. **영향:** (1) 에러 발생 시 `use-tier-me-page-controller`만 `RpcError`의 안정된 `i18nKey`로 번역되고 나머지는 raw `PostgrestError`를 그대로 `translateError()`에 넘겨 경로가 달라짐 — 사용자가 보는 에러 문구가 페이지마다 미묘하게 다를 수 있는 **근본 원인**. (2) 신규 개발자가 "Earn Hub 상태를 어떻게 가져오는가"를 파악하려면 최소 4개의 다른 상수명을 다 찾아야 함.

### 1-B.2 라우트는 있는데 메뉴 진입이 불가능한 것 (오펀 라우트)

BottomNav(5) · TopBar · `earn-subnav`/`wallet-subnav`/`trade-subnav`/`sports-subnav`/`casino-subnav` · `subnav-route-manifest.ts`의 전체 등재 경로를 웹 93개 라우트 전체와 대조하고, 의심 후보 각각에 대해 `<Link to="...">` / `navigate({ to: "..." })` 문자열 참조를 `apps/web/src` 전체에서 재검색했다.

| 라우트                  | 페이지 상태                                                                                                          | 인앱 진입점 검색 결과                                                                                                                                                                                                                                                                                      |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/tier/leaderboard`     | 실구현 (`tier-leaderboard-page.tsx`, contract+test 완비, PER_PAGE_UI_MATRIX loading/empty/error/responsive 전부 yes) | **0건** — `earn-subnav.ts`에 `/tier/me`·`/tier/benefits`는 있으나 `/tier/leaderboard`는 chip 목록에 없음. `PLATFORM_EWAVE_HIDDEN_ROUTES`에도 없어(="숨김 대상 아님") 의도적 비노출이라는 증거도 없음                                                                                                       |
| `/rewards/history`      | 실구현 (`rewards-history-page.tsx`)                                                                                  | **0건** — wallet-subnav·settings 어디에도 링크 없음                                                                                                                                                                                                                                                        |
| `/staking/positions`    | 실구현 (`staking-positions-page.tsx`)                                                                                | **0건** — `staking-hub-page.tsx`를 직접 열람한 결과 페이지 내부에 `TIER_BENEFITS_ROUTE` 링크만 있고 `/staking/positions`로 가는 버튼은 없음. 레거시 리다이렉트 `/my-earn` → `/staking/positions`(`route-redirect-registry.ts:100`)만 존재 — 옛 URL을 아는 사용자만 우회 도달 가능                          |
| `/referral/leaderboard` | 실구현이나 **의도적으로 미노출**                                                                                     | `P11_GATE_SIDE_INCOME_STUB_ROUTES = ['/referral/leaderboard']`로 명시적 "stub route" 지정 + `isReferralLeaderboardWireLive()` feature-flag 게이트 + 테스트가 "`earnVisible`에 포함되면 안 됨"을 명시적으로 단언(`p11-gate-side-income-display-contract.test.ts:78`) — **의도된 단계적 출시이며 버그 아님** |

**Finding ZA-06 (P2):** `/tier/leaderboard`·`/rewards/history`·`/staking/positions` 3개 라우트는 완성된 페이지이지만 앱 내 어떤 링크·버튼에서도 도달할 수 없다(`/referral/leaderboard`처럼 의도적 stub 표시도 없음 — 즉 "의도적으로 숨김"이 아니라 "잊혀진 진입점"에 가깝다). 근거: `earn-subnav.ts`·`wallet-subnav.ts`·`subnav-route-manifest.ts` 전체 열람 + `apps/web/src` 전체 대상 `to="..."` grep 0건.

### 1-B.3 메뉴엔 있는데 라우트가 없는 것 — 죽은 링크 (신규·최고 심각도)

`tier-me-page.tsx`(등급 페이지, 사용자가 예시로 든 바로 그 페이지)를 끝까지 판독한 결과, 실제로 렌더링되는 버튼 하나가 **존재하지 않는 라우트**를 가리키고 있음을 확인했다.

```376:387:apps/web/src/product/surfaces/tier/tier-me-page.tsx
<a
  href={TIER_ME_HISTORY_ROUTE}
  className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-foreground-muted w-fit px-0')}
  data-testid="tier-me-history-link"
>
  <History className="size-4" aria-hidden />
  {t('tier.me.historyLink')}
  <ChevronRight className="size-4" aria-hidden />
</a>
```

`TIER_ME_HISTORY_ROUTE = '/tier/me/history'`(`tier-me-display-contract.ts:21`)인데, `apps/web/src/routes/tier.me.history.tsx`는 **디스크에 존재하지 않는다**(Glob 0건, `routeTree.gen.ts` 전체에도 `/tier/me/history` 항목 없음). 유일한 테스트 커버리지는 다음 한 줄뿐이다:

```128:apps/web/src/product/surfaces/tier/__tests__/tier-me-page.test.tsx
expect(screen.getByTestId('tier-me-history-link')).toHaveAttribute('href', '/tier/me/history');
```

이 테스트는 "href 속성값이 상수와 일치하는가"만 검증하고 **그 라우트가 실제로 존재하는지는 검증하지 않는다** — 그래서 100% 통과하면서도 죽은 링크가 그대로 남아 있다. 실제 클릭 흐름: `<a href>`(TanStack `<Link>`가 아닌 순수 HTML 앵커 — 클라이언트 라우팅이 아니라 전체 페이지 새로고침 발생) → Cloudflare Pages `_redirects`(`/* /index.html 200`)가 SPA로 되돌림 → TanStack Router가 `/tier/me/history`에 매칭되는 라우트를 못 찾음 → `__root.tsx`의 `notFoundComponent`(`NotFoundPage`) 렌더. 즉 사용자는 새로고침 깜빡임 후 "페이지를 찾을 수 없음" 화면을 보게 된다.

같은 파일의 `TIER_BENEFITS_ROUTE` 링크(286-292행)도 동일하게 `<a href>`(TanStack `<Link>` 아님)로 구현되어 있어, 등급 페이지 내부 네비게이션 자체가 클라이언트 라우팅과 전체 새로고침 방식이 혼재되어 있다.

**Finding ZA-07 (P1 — 본 감사 최고 심각도 단일 코드 결함):** `/tier/me`(등급) 페이지의 실제 렌더링된 "히스토리 보기" 버튼이 존재하지 않는 라우트로 연결되어 100% 재현 가능한 404를 유발한다. 근거: `tier-me-page.tsx:376-387` · `tier-me-display-contract.ts:21` · `apps/web/src/routes/tier.me.history.tsx` 부재(Glob 확인) · `routeTree.gen.ts` 미등재 · 대응 테스트가 속성값만 검증(`tier-me-page.test.tsx:128`). **사용자가 원 질문에서 예시로 든 "등급 페이지만 실패"는 최소 두 가지 독립된 코드 근거를 갖는다: (a) 1-B.1의 RPC 클라이언트 경로 불일치, (b) 본 항목의 실제 죽은 링크.**

### 1-B.4 같은 데이터를 다른 소스에서 — 캐시백률 3중 소스 (사용자 지정 확인 항목)

| 화면                         | 캐시백률 데이터 소스                                                                                | 실시간 여부                                |
| ---------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `earn-cashback-page.tsx`     | `EARN_CASHBACK_HUB_STATUS_RPC` = `rpc_get_earn_hub_status` (raw `supabase.rpc`)                     | **실시간** — 20초 staleTime TanStack Query |
| `tier-benefits-page.tsx`     | 리터럴 `'rpc_get_earn_hub_status'` (raw `supabase.rpc`)                                             | **실시간**                                 |
| `fees-page.tsx`              | `buildFeesCashbackRows()` — RPC·훅 호출 **없음**, i18n 키 `tier.guide.rows.${tier}.cashback`만 참조 | **정적** (코드 주석에 "not live RPC" 명시) |
| (참고) `tier-guide-page.tsx` | 위와 동일 i18n 키 네임스페이스 재사용(주석: "same as cashback center")                              | **정적**                                   |

**답변(사용자 질문 — 등급 상승 시 동시 갱신 여부):** `earn-cashback-page`와 `tier-benefits-page`는 **같은 RPC를 각자 재호출**하므로 서로 간에는 일관성이 유지된다(포맷터가 다르지 않다면). 그러나 `fees-page`(및 `tier-guide-page`)는 **애초에 사용자의 등급이나 RPC 응답을 조회하지 않는 정적 안내 표**이므로, 개인의 등급 상승과 무관하게 항상 같은 i18n 카탈로그 값을 보여준다 — 이는 "동기화 실패"가 아니라 **처음부터 별개 데이터(개인화된 실시간 값 vs 공개 마케팅 정적 표)** 라는 뜻이다. 실질적 위험은 다른 지점에 있다: **운영자가 등급별 캐시백률 자체를 변경하면**, `earn-cashback`/`tier-benefits`는 다음 RPC 호출 시 즉시 새 값을 반영하지만 `fees-page`/`tier-guide-page`는 `packages/i18n` 카탈로그를 수동으로 갱신하지 않는 한 **옛 값을 계속 보여준다.** `assertFeesPageContractSync()`(`fees-page-display-contract.ts:44`)는 행(row) **개수**만 검증하고 캐시백 **값**의 일치는 검증하지 않는다.

**Finding ZA-08 (P2):** 등급별 캐시백률이 실시간(RPC) 경로와 정적(i18n) 경로 두 곳에 이중 관리되며, 값 일치를 강제하는 자동 검증이 없다(개수만 검증). 근거: `fees-page-display-contract.ts` 전체, `earn-cashback-page-controller.ts:23`, `use-tier-benefits-page-controller.ts:33`. 사용자가 언급한 "등급 상승 → 캐시백률 즉시 반영" 크로스도메인 기능을 만들 경우, RPC 경로 2곳은 전제조건이 충족되어 있으나 정적 경로 2곳(`/fees`, `/tier`(guide))은 별도의 수동 동기화 절차 없이는 반영되지 않는다는 점을 설계에 반영해야 한다.

### 1-B.5 로딩/에러/빈값 처리 통일성

기존 `PER_PAGE_UI_MATRIX.md`(79 surfaces 정적 스캔)를 재사용한다 — Loading yes 70.9%·Empty yes 39.2%·Error yes 60.8%·Responsive yes 72.2%, 이미 `SA-02(LOW)`로 등록됨. 본 감사에서 추가 재도출하지 않음.

### 1-B.6 원본 0/null 노출 지점 — 표본 점검

- 표준 패턴(`>{value.balance}<` 류 직접 보간) grep: **0건** — MoneyDisplay/포맷터 경유 규율이 표면적으로는 지켜지고 있음.
- `.toFixed()` 사용 파일: `product/surfaces`에서 13개(대부분 카지노 게임 스테이지: crash·hilo·deepshaft·mint-reels·blackjack·gold-rush·limbo·dice·mines·momentum·roulette), `features`에서 13개. 대표 샘플(`crash-stage.tsx`) 확인 결과 **서버가 계산한 배당률(`crashMultiplier`)을 문자열로 표시하는 용도**로만 사용되어 클라이언트 측 정산 계산은 아님(1-F에서 대표 RPC 코드까지 교차 확인 예정). **전수(26개 파일) 확인은 아니며 표본 판단임을 명시.**

---

**1-B 완료.** 신규 finding: ZA-05(P0)·ZA-06(P2)·ZA-07(P1)·ZA-08(P2). 다음: 1-C (레이아웃/반응형 — breakpoint 일관성, 하단 네비 겹침 근본원인 전수 확인).

---

## 1-C. 레이아웃/반응형 현황

### 1-C.1 Breakpoint 정의 일관성

`apps/web/src/product/tokens/theme.css:121-133`에 breakpoint 토큰 SOT가 존재한다:

```121:133:apps/web/src/product/tokens/theme.css
--breakpoint-sm: 480px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1920px;
--breakpoint-2xl: 2560px;

--breakpoint-mobile-narrow: 320px;
--breakpoint-mobile: 390px;
--breakpoint-tablet: 768px;
--breakpoint-desktop: 1024px;
--breakpoint-wide: 1280px;
--breakpoint-ultra: 1920px;
--breakpoint-superwide: 2560px;
```

**관찰:** 두 개의 네이밍 체계가 공존한다 — Tailwind 관례(`sm`/`md`/`lg`/`xl`/`2xl`)와 의미 기반 이름(`mobile`/`tablet`/`desktop`/`wide`/`ultra`). 값 자체는 4개(768·1024·1920·2560)가 두 체계에서 겹치고, 나머지(`sm`=480, `mobile`=390, `wide`=1280)는 서로 다른 목적의 값이라 완전한 중복은 아니다. `--breakpoint-sm`이 Tailwind 기본값(640px)이 아니라 480px로 재정의되어 있다는 점도 확인함(의도된 커스터마이징으로 보이나 문서화는 없음).

CSS 파일 내 `@media (min-width: ...)` 실사용을 전수 grep한 결과(`layout.css`·`shell-chrome.css`), 768px·1024px·1280px·1920px **리터럴 숫자만** 사용되고 위 토큰과 값이 전부 일치한다. (CSS 명세상 `@media`는 커스텀 프로퍼티를 직접 참조할 수 없어 리터럴이 불가피 — 토큰 미사용이 아니라 CSS 자체의 제약임.) **판정:** breakpoint 값 자체의 일관성은 실측상 문제 없음 — 기존 Pillar 3의 "390px root bypass 0" 주장과 독립적으로 일치.

**Finding ZA-09 (P3):** breakpoint 토큰이 Tailwind 관례명과 의미기반명 2체계로 중복 정의되어 있어(`--breakpoint-md`=`--breakpoint-tablet`=768px 등) 신규 작성 시 어느 쪽을 써야 하는지 문서화된 기준이 없다.

### 1-C.2 하단 네비게이션 겹침 — 근본원인 전수 확인

`fixed`/`sticky` + `bottom` 계열 포지셔닝을 쓰는 컴포넌트를 전수 검색하고, 각각이 `--ds-shell-bottomnav-height` clearance를 실제로 적용하는지 코드로 직접 대조했다.

| 컴포넌트                                                                        | 위치 방식                                                                                                               | BottomNav 높이 보정 여부                                                           |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `AppShell` 본문(`.ds-shell-main-with-bottomnav`, `shell-chrome.css:237-247`)    | `padding-bottom: calc(var(--ds-shell-bottomnav-height) + ...)`, `lg:` 이상은 0                                          | ✅ 적용 (BottomNav 자체가 `lg:hidden`이므로 정확)                                  |
| `bottom-nav.tsx` (BottomNav 본체)                                               | `fixed inset-x-0 bottom-0`                                                                                              | 해당 없음(자기 자신)                                                               |
| `pwa-install-banner.tsx`                                                        | `fixed inset-x-0 bottom-[calc(var(--ds-shell-bottomnav-height)+env(safe-area-inset-bottom,0px))]`, `lg:bottom-4`로 전환 | ✅ 값은 정확 — **but** 아래 ZA-10 참조                                             |
| `trade-desk-mobile-sticky-cta`(매수/매도 버튼, `trade-desk-layout.css:136-142`) | `position: sticky; bottom: calc(var(--ds-shell-bottomnav-height, 56px) + env(safe-area-inset-bottom, 0px))`             | ✅ 적용 — Trade 데스크 매수/매도 버튼이 BottomNav와 겹치지 않도록 동일 토큰 재사용 |

**3곳 모두 동일한 `--ds-shell-bottomnav-height` 토큰을 일관되게 재사용하고 있음을 확인했다 — 코드 레벨에서 "하단 네비와 콘텐츠가 겹치는" 활성 결함은 발견하지 못했다.** 이는 부정 결과이지만 zero-assumption 원칙상 그대로 기록한다: 사용자가 실제로 겹침을 목격했다면 (a) 특정 기기의 `env(safe-area-inset-bottom)` 처리 차이, (b) 아래 ZA-10의 PWA 배너 조건, (c) 본 감사에서 다루지 않은 카지노 게임 스테이지 내부 UI 중 하나일 가능성이 높다 — **브라우저 실측 없이는 완전히 배제할 수 없음(NOT VERIFIED)**.

**Finding ZA-10 (LOW):** `resolvePwaInstallBannerVisible()`(`notifications-pwa-display-contract.ts:326-334`)는 `pathname === '/install'`인 경우만 배제하고 그 외 **모든 경로에서 true**를 반환한다 — `AppShell`(BottomNav 있음)과 `MarketingShell`/`ContentShell`(BottomNav 없음)을 구분하지 않는다. 배너 CSS는 항상 `bottom-[calc(var(--ds-shell-bottomnav-height)+...)]`만큼 띄우므로, BottomNav가 없는 화면(로그인 전 마케팅 페이지 등)에서 `hasContextNudge`가 우연히 true인 순간에는 존재하지 않는 네비 높이만큼 빈 공간이 뜬 채로 배너가 표시될 수 있다. 근거: `pwa-install-banner.tsx:65` · `pwa-shell.tsx:31`(전역 마운트) · `notifications-pwa-display-contract.ts:330-333`. **실제 발생 빈도는 nudge 트리거 조건(로그인 직후 등)에 좌우되어 낮을 것으로 추정 — 과장하지 않음.**

### 1-C.3 페이지별 PC 전용 vs 모바일 대응 레이아웃

| 영역                                      | 모바일                                                                     | 데스크톱(`lg:` 1024px+)                                                                            | 근거                                                           |
| ----------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Earn 셸                                   | `EarnSubnavMobile`(가로 스크롤 chip)                                       | `EarnSideNavDesktop`(240px 고정 사이드바) + `EarnSideRailDesktop`(64px 축소 레일)                  | `appshell.tsx:99-107`                                          |
| BottomNav                                 | 5탭 고정 표시                                                              | `lg:hidden` — 완전히 사라짐(데스크톱은 TopBar+사이드바로 대체)                                     | `appshell.tsx:109`                                             |
| 도메인 subnav(Trade/Sports/Casino/Wallet) | `HorizontalSubnav`(가로 스크롤)                                            | `lg:hidden` — 데스크톱은 해당 없음(전용 데스크 레이아웃으로 대체 추정)                             | `appshell.tsx:34-76`                                           |
| Trade 데스크                              | `trade-desk-mobile-tabs.tsx`(탭 전환) + `trade-desk-mobile-sticky-cta.tsx` | `trade-desk-tablet-layout.tsx` + `trade-desk-bottom-dock.tsx`(포지션/주문/히스토리 패널 동시 노출) | 파일 구조상 모바일/태블릿/데스크톱 3종 레이아웃 파일 분리 확인 |

**판정:** 최소 Earn·Trade 영역은 "모바일 클램프 하나로 대응"이 아니라 실제로 구조가 분리된 3-tier 반응형이 코드로 확인된다. 전체 79 web surface에 대한 개별 PC-only/mobile-only 레이아웃 존재 여부 전수화는 범위상 생략(PER_PAGE_UI_MATRIX의 Responsive yes 72.2% 인용).

---

**1-C 완료.** 신규 finding: ZA-09(P3)·ZA-10(LOW). 다음: 1-D (디자인 시스템 — 실제 토큰값 추출, 정적/동적 표시 비율).

---

## 1-D. 디자인 시스템 현황

### 1-D.1 실제 토큰값 (추출 — 문서 아닌 CSS 원본에서 직접)

**색상** (`colors.css`) — 전부 **OKLCH**, `light-dark()`로 라이트/다크 단일 선언(중복 규칙셋 없음). 파일 자체 주석: "hex/hsl 신규 정의 금지."

| 토큰                                     | 라이트                                        | 다크                                           |
| ---------------------------------------- | --------------------------------------------- | ---------------------------------------------- |
| `--ds-bg`                                | `oklch(0.98 0.008 260)`                       | `oklch(0.145 0.012 260)`                       |
| `--ds-accent` (브랜드 민트, Earn 정체성) | `oklch(0.52 0.17 165)`                        | `oklch(0.78 0.17 165)`                         |
| `--ds-success` / `--ds-danger`           | `oklch(0.48 0.17 155)` / `oklch(0.5 0.21 25)` | `oklch(0.72 0.17 155)` / `oklch(0.65 0.21 25)` |
| `--ds-market-up` / `--ds-market-down`    | `oklch(0.48 0.17 155)` / `oklch(0.5 0.21 25)` | `oklch(0.72 0.17 155)` / `oklch(0.62 0.21 25)` |
| Tier ramp (bronze~prime)                 | hue 고정 55~280, lightness만 단계 조정        | 동일                                           |

`--ds-market-up`이 `--ds-success`와 현재 라이트 모드에서 값이 같지만(둘 다 155 hue), **의미론적으로는 분리된 별도 토큰**(주석: "market 색과 분리") — 우연한 일치이지 병합은 아님.

**여백/타이포** (`spacing.css`·`fonts.css`) — 4px 그리드(`--ds-space-1`=4px ~ `--ds-space-12`=64px), radius 3단계(8/12/16px), **`--ds-touch-target-min: 48px`**(접근성 하한 명시). 타이포는 `clamp()` 기반 fluid scale(8단계, `--ds-text-tiny`~`--ds-text-hero`) + **ko/en 로케일별** line-height·tracking·font-weight 분리(`html[lang='ko']`/`html[lang='en']`). 폰트는 self-hosted woff2 3종(Pretendard/Space Grotesk/JetBrains Mono) — CDN 의존 없음.

**판정:** 사용자의 원 질문("토큰화되어 있는지, 페이지마다 인라인으로 산발적으로 정의되어 있는지")에 대한 답은 **토큰화되어 있다** — OKLCH 컬러 시스템, 4px 그리드, 로케일 인지 타이포그래피까지 갖춘, 예상보다 성숙한 단일 SOT 체계다.

### 1-D.2 인라인 하드코딩 위반 카운트

- `apps/web/src/product/surfaces/**/*.tsx`(테스트 제외) 전수에서 **raw hex 색상(`#xxxxxx`) 사용: 0건.** hex가 나오는 곳은 게이트 테스트 파일(`__tests__/*.test.tsx`)뿐이며 이는 hex **부재**를 검증하는 테스트다.
- `style={{...}}` 인라인 스타일: 79개 페이지 기준 **11개 파일·16곳**. 대표 샘플 확인 결과 전부 (a) 런타임 결정 값을 토큰 `var()`로 참조(예: `tier-me-page.tsx`의 `` `var(${tierColorVar})` ``, 등급별 색상은 정적 클래스로 표현 불가) 또는 (b) 게임 UI의 퍼센트 기반 위치값(`dice-stage.tsx`의 `left: ${markerPct}%`) — **토큰 우회가 아니라 Tailwind 유틸리티로 표현 불가능한 런타임 값의 정당한 처리**.

**판정:** 인라인 하드코딩 위반은 **거의 없음(0건 hex, 16곳 style 전부 정당화됨)** — `colors.css`의 "hex/hsl 신규 정의 금지" 규율이 실제로 지켜지고 있다.

### 1-D.3 정적 vs 동적 표시 비율

기존 `PER_PAGE_UI_MATRIX.md`를 재사용해 loading/empty/error 신호가 **전부 "no"인 페이지**를 정적 후보로 집계했다: `landing-page`·`login-page`·`legal/*`(6개)·`features-vip-page`·`features-earn-page`·`trust-security-page` 등 **약 10~11개 / 79개(약 13~14%)**. 이들은 대부분 로그인 전 마케팅/법률 페이지로, 정적인 것이 오히려 올바른 설계(RPC 왕복 없이 즉시 렌더)다.

`fees-page`/`tier-guide-page`(1-B.4에서 확인)처럼 **로그인 후 데이터 페이지인데 정적 i18n을 쓰는 경우**는 이 13~14%에는 안 잡히지만(정적/동적 컬럼이 아니라 loading/error 유무 기준이라 애매) 별도 리스크로 이미 ZA-08에 기록했다. 사용자가 예로 든 "배당률 —" 패턴은 스포츠 마켓 데이터가 없을 때 `0`이 아니라 em-dash를 표시하는 **fallback 규율**로 보이며, 이는 원본 데이터 노출(1-B.6에서 0건 확인)보다는 오히려 바람직한 처리로 판단된다 — 단, 브라우저 실측 없이 전 종목 배당률 표시를 전수 확인한 것은 아니다(NOT VERIFIED).

---

**1-D 완료.** 신규 finding 없음(전부 검증 결과 양호 — 인라인 위반 0건, 토큰 체계 성숙). 다음: 1-E (Earn 도메인 — 전략적 최우선 도메인 페이지별 실완성도).

---

## 1-E. Earn 도메인 현황 (전략적 최우선 도메인)

### 1-E.1 페이지별 실완성도 (컨트롤러 코드 직접 판독 — "Complete" 라벨을 그대로 신뢰하지 않음)

`docs/audit/MASTER_INVENTORY_AUDIT_2026-07-13.md` §9는 "Earn/Missions/Referral/Tier: **Complete**"로 한 줄 판정했다. 8개 컨트롤러(`use-home-attendance-page-controller` · `use-home-missions-page-controller` · `use-referral-page-controller` · `use-tier-me-page-controller` · `use-tier-benefits-page-controller` · `use-earn-cashback-page-controller` · `use-share-earnings-page-controller` · `use-staking-page-controller`)를 직접 열어 재판정했다.

| 페이지                                             | 판정                                            | 근거                                                                             |
| -------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------- |
| 출석 (`home-attendance-page`)                      | **정상**                                        | 실 RPC 3종 + `user_streaks` 테이블 직접 조회 + claim 플로우 완비, TODO/stub 없음 |
| 미션 (`home-missions-page` + invite/referral 하위) | **정상**                                        | `resolveHomeMissionCtaRoute()`(1-E.2 근거) 등 미션별 딥링크 라우팅까지 구현됨    |
| 친구초대 (`referral-page`/`referral-invite-page`)  | **정상**                                        | 실 RPC 연동 확인                                                                 |
| 친구초대 리더보드 (`referral-leaderboard-page`)    | **페이지는 정상이나 도달 불가**                 | 1-B.2 ZA-06 — 앱 내 링크 없음                                                    |
| 등급 (`tier-me-page`)                              | **부분**                                        | RPC 연동은 정상이나 "히스토리 보기" 버튼이 죽은 링크(1-B.3 ZA-07)                |
| 등급 리더보드 (`tier-leaderboard-page`)            | **페이지는 정상이나 도달 불가**                 | ZA-06                                                                            |
| 혜택 (`tier-benefits-page`)                        | **정상**                                        | 실 RPC 연동                                                                      |
| 캐시백 (`earn-cashback-page`)                      | **정상** (단, 정적 병행 소스 존재 — ZA-08 참조) |                                                                                  |
| 공유 (`share-earnings-page`)                       | **정상**                                        | 실 RPC 연동                                                                      |
| 스테이킹 (`staking-hub-page`)                      | **정상**                                        | 실 RPC 연동, `TIER_BENEFITS_ROUTE` 링크 확인                                     |
| 스테이킹 포지션 (`staking-positions-page`)         | **페이지는 정상이나 도달 불가**                 | ZA-06 — `staking-hub-page.tsx`에 이 라우트로 가는 버튼 없음 확인                 |

**종합:** "완전 실패"는 0건이다 — 전 페이지가 실제 RPC/테이블에 연결된 실 구현체이며 TODO/stub 잔존물도 없다. 다만 (1) 8개 컨트롤러 전부가 1-B.1의 `callRpc` 우회 패턴에 걸려 있고(구조적 위험 공통), (2) 등급 페이지의 죽은 링크 1건, (3) 리더보드·포지션류 하위 페이지 3개가 도달 불가 상태다. **"Complete" 라벨은 RPC 연동 여부 기준으로는 맞지만, 내비게이션 도달성·에러 경로 일관성까지 포함하면 정확한 표현이 아니다.**

### 1-E.2 Earn → Trade/Sports/Casino 전환 지점 (정밀 카운트)

`product/surfaces` 전체에서 `to="/trade"`/`to="/sports"`/`to="/casino"` 리터럴을 grep한 결과 Earn 도메인 페이지에서 시작하는 것은 **0건**이었다. 그러나 라우트가 데이터 구조체(`route: string` 필드)로 저장되어 동적으로 렌더링되는 경우가 있어, `domain/earn-home-display-contract.ts`·`domain/home-missions-display-contract.ts`를 직접 열어 재확인했다.

**(1) `earn-home-page`의 고정 진입 카드 4개** (`EARN_HOME_ENTRY_CARDS`, `earn-home-display-contract.ts:149-197`):

| id         | 목적지                                                                      |
| ---------- | --------------------------------------------------------------------------- |
| `missions` | `/home/missions` (Earn 내부)                                                |
| `events`   | `/events` (Earn 내부)                                                       |
| `wallet`   | `/wallet` (Wallet — Earn 외부지만 사용자 질문 범위(Trade/Sports/Casino) 밖) |
| `bet`      | **`/sports`** ← Trade/Sports/Casino 중 유일한 정적 카드                     |

**(2) `home-missions-page`의 미션별 딥링크** (`resolveHomeMissionCtaRoute()`, `home-missions-display-contract.ts:132-165`, 미션 14종 전수):

| 목적지       | 매핑된 미션                                                   | 개수  |
| ------------ | ------------------------------------------------------------- | ----- |
| `/casino`    | `growth-firstGame`·`weekly-play5`·`weekly-win3`               | **3** |
| `/sports`    | 없음                                                          | 0     |
| `/trade`     | 없음                                                          | **0** |
| (참고) 그 외 | `/referral*`·`/wallet/deposit`·`/account*`·`/tier/me`·`/home` | 9     |

**답 (사용자 질문 — 전환 지점 몇 개·위치):**

- **Casino: 3개** — 전부 미션 완료 유도 딥링크(`growth-firstGame`·`weekly-play5`·`weekly-win3` → `/casino`), `home-missions-display-contract.ts:146,153`
- **Sports: 1개** — `earn-home-page` 정적 진입 카드(`id: 'bet'`) 1개, `earn-home-display-contract.ts:195`
- **Trade: 0개** — Earn 도메인 전체(정적 카드·미션 딥링크·기타 CTA)에서 `/trade`로 가는 지점을 찾지 못했다. `EARN_HOME_ENTRY_CARDS`에도, `resolveHomeMissionCtaRoute()` 14개 분기에도 없음.

**Finding ZA-11 (P2):** Earn(전략적 최우선 도메인)에서 Casino로의 전환 지점(3)과 Sports(1)는 존재하나 **Trade로의 전환 지점이 코드상 0개**다. Trade가 다른 두 도메인과 동등한 우선순위의 수익 채널이라면 이는 설계 공백이다(단, Trade를 Earn 크로스셀 대상에서 의도적으로 제외했을 가능성도 있어 사용자/제품 의도 확인 필요 — 코드만으로는 "실수"인지 "의도"인지 판별 불가, UNVERIFIED로 남김).

---

**1-E 완료.** 신규 finding: ZA-11(P2). 다음: 1-F (보안/데이터 정합성 — Wallet/Ledger RPC 코드 직접 판독, Σ=0 로직, 인증 가드 커버리지).

---

## 1-F. 보안/데이터 정합성 현황

> 기존 문서는 "SQL 142 테스트 존재"·"Σ=0 이력"을 **인용**만 했다(실행 이력 참조, 코드 본문 판독은 아님). 본 절은 실제 마이그레이션 SQL 함수 본문을 직접 열어 동시성 제어·자금 안전 로직을 코드로 확인한다. SQL 실행은 하지 않음(G13 — CI `sql` job이 정본).

### 1-F.1 `rpc_transfer_to_user` (P2P 이체) — 동시성 제어 직접 판독

`supabase/migrations/20260811000001_ew_e8_financial.sql:361-513` (최신 정의) 전문을 읽었다.

```463:470:supabase/migrations/20260811000001_ew_e8_financial.sql
-- Deadlock-safe wallet lock order
IF v_sender < v_recipient THEN
  v_first := v_sender; v_second := v_recipient;
ELSE
  v_first := v_recipient; v_second := v_sender;
END IF;
PERFORM 1 FROM wallets WHERE user_id = v_first FOR UPDATE;
PERFORM 1 FROM wallets WHERE user_id = v_second FOR UPDATE;
```

**확인된 안전장치:**

- **데드락 방지 잠금 순서:** 두 지갑을 UUID 크기 순으로 정렬해 항상 같은 순서로 `FOR UPDATE` 행 잠금 — A→B, B→A 동시 이체가 서로를 교착시키지 않도록 하는 표준 패턴.
- **멱등성(idempotency):** `rpc_request_idem` 유니크 제약(`user_id, client_request_id`) + `ON CONFLICT DO NOTHING` → 중복 요청은 캐시된 결과를 그대로 반환(`idempotent: true`) — 이중 실행 방지.
- **인증/사전조건 가드 6종 순차 실행**(라인 389-395): 미인증 차단 · 시스템 라이브 · 기능 플래그 · 계정 활동 상태 · 온보딩 동의 · 제재 심사 · 레이트리밋 — 자금 이동 전 **전부** 통과해야 함.
- **금액 검증:** 정규식(`^\d+(\.\d+)?$`) + 양수 체크, 수수료는 `floor(v_amount * v_fee_bps) / 10000.0`(PostgreSQL `NUMERIC` — 임의정밀도 10진수, **부동소수점 아님**).
- **권한:** `REVOKE ALL ... FROM PUBLIC, anon; GRANT EXECUTE ... TO authenticated;`(515-516) — anon 호출 불가.

### 1-F.2 `_debit_wallet_internal` — TOCTOU까지 닫은 이중 멱등성 체크

`20260730000001_pir_idempotency_handlers.sql:175-` 직접 판독.

```198:210:supabase/migrations/20260730000001_pir_idempotency_handlers.sql
SELECT id INTO v_entry_id FROM wallet_ledger WHERE idempotency_key = p_idempotency_key;
IF FOUND THEN RETURN v_entry_id; END IF;
...
SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id FOR UPDATE;
IF NOT FOUND THEN RAISE EXCEPTION 'wallet_not_found'; END IF;

-- PIR E5: re-check after row lock (closes TOCTOU before mutate)
SELECT id INTO v_entry_id FROM wallet_ledger WHERE idempotency_key = p_idempotency_key;
IF FOUND THEN RETURN v_entry_id; END IF;
```

멱등성 키를 **행 잠금 전**과 **행 잠금 후** 두 번 체크한다 — 주석이 명시하듯 "PIR E5"에서 발견된 TOCTOU(Time-Of-Check-To-Time-Of-Use) 경쟁 조건을 잠금 후 재확인으로 닫은 것. 동시에 도착한 동일 idempotency key 요청 2건이 둘 다 첫 체크를 통과해도, `FOR UPDATE`로 한쪽이 블록되었다가 앞선 트랜잭션 커밋 후 재확인에서 걸려 중복 차감을 막는다. 이 헬퍼 자체는 `REVOKE ALL ... FROM PUBLIC, anon, authenticated`(900-901)로 **어떤 클라이언트 역할도 직접 호출 불가** — `rpc_*` 래퍼를 통해서만 내부적으로 호출됨을 확인.

### 1-F.3 음수 방지 — 스키마 레벨

`wallets` 테이블(`20260609000001_phase1_auth_wallet_ledger.sql:66-80`) 컬럼이 `NUMERIC`이 아니라 **`TEXT` + 정규식 CHECK 제약**(`^-?\d+(\.\d+)?$`)으로 정의되어 있다 — 부동소수점 컬럼 타입 자체를 원천 차단하고, 앱 레이어(`@phonara/money` Decimal)가 문자열을 파싱/직렬화하는 구조. 음수 잔액 방지는 CHECK 제약이 아니라(`-?`가 포함되어 형식상 음수 허용 — 내부 시스템 계정용) **`_debit_wallet_internal` 함수 내부 로직**(라인 213 `CASE p_currency` 분기, 213줄 이후는 본 감사에서 끝까지 읽지 않음 — 시간 배분상 생략, `insufficient_balance` 류 RAISE가 있을 것으로 강하게 추정되나 **행 자체를 인용하지 못했으므로 NOT VERIFIED로 명시**)에서 처리되는 것으로 보인다.

### 1-F.4 Σ=0 (GRAND_TOTAL) 검증 로직 — 실제 계산 방식

`supabase/tests/conservation_test.sql`을 직접 읽었다. 하드코딩된 절대값이 아니라 **델타 불변식**이다:

```65:91:supabase/tests/conservation_test.sql
-- (연산 전 스냅샷)
(SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC),0) FROM wallets)
+ (SELECT COALESCE(SUM(balance::NUMERIC),0) FROM system_accounts WHERE currency='PHON'),
...
-- (RPC 실행)
-- (연산 후 스냅샷 — 동일 쿼리)
-- (연산 전 == 연산 후 단언 → "grand total per currency unchanged")
```

전체 사용자 지갑(`available`+`locked`) 합 + 전체 시스템 계정(house/insurance/liquidity/dust/mint) 합을 RPC 실행 **전후로 비교**해 정확히 같아야 한다고 단언한다 — 어딘가에서 빠져나간 돈은 반드시 다른 어딘가(수수료 계정 등)로 들어가야 하고, 총합 자체는 절대 변하지 않아야 한다는 방식. **이 로직 자체는 실행하지 않았다**(G13 — 로컬 `test:sql` agent 자율 실행 금지, CI `sql` job이 정본이며 기존 문서가 인용한 "Σ=0.000000" 통과 이력을 그대로 신뢰함) — 로직의 **존재와 설계**만 코드로 확인했다.

### 1-F.5 인증 가드 커버리지 — 실측

`apps/web/src/routes/**/*.tsx` 93개 중 `beforeLoad` 리터럴을 직접 grep한 결과 **55개 파일**에서 발견됐다. 나머지 ~38개는 대부분 (a) 인증이 필요 없는 공개 라우트(로그인/가입/약관/마케팅) 또는 (b) `beforeLoad`가 있는 부모 라우트의 자식(TanStack Router는 부모 `beforeLoad`가 자식 네비게이션에도 적용됨 — 예: `sports.live.tsx`는 자체 `beforeLoad`가 없지만 부모 `sports.tsx`에 있음)으로 추정된다. **정확한 유효 커버리지(부모-자식 상속까지 반영한 전수)는 라우트 트리 추적이 필요해 본 감사에서 끝까지 확인하지 못했다 — NOT VERIFIED.** 기존 `MASTER_INVENTORY_AUDIT` §4.1의 "대부분 beforeLoad" 서술과 방향은 일치하나(55/93 ≈ 59%가 자체 보유), "대부분"이라는 표현의 정밀화는 후속 과제로 남긴다.

### 1-F.6 관리자 API 접근 통제

1-A.3에서 이미 확인한 `apps/admin/src/hooks/admin/useAdminOperatorRbac.ts`(fail-closed) 패턴과 `admin-casino-page.tsx` 등의 실제 RPC 연동을 재확인한 것 외 추가 신규 조사는 생략 — 기존 Pillar 5(`05_SECURITY.md`)의 "AAL2 step-up · fail-closed RBAC · PIR P1 vitest 17/17" 서술이 코드 구조(REVOKE/GRANT 패턴, `SECURITY DEFINER` 헤더)와 부합함을 본 절의 1-F.1·1-F.2 판독으로 간접 확인함.

**Finding 없음 — 1-F는 전부 검증/확인(positive) 결과.** Wallet/Ledger 핵심 RPC의 동시성 제어·멱등성·권한 통제는 표본 판독 기준 **세계 수준의 방어적 설계**로 확인된다. NOT VERIFIED로 남긴 것: (1) 음수 방지의 정확한 코드 라인(추정만), (2) 라우트 beforeLoad 상속 전수, (3) Σ=0 테스트의 현재 실제 pass/fail(CI 인용).

---

**PART 1 전체 완료.** 신규 finding 총 11건: ZA-01(P2)·ZA-02(P3)·ZA-03(P2)·ZA-04(P3)·ZA-05(P0)·ZA-06(P2)·ZA-07(P1)·ZA-08(P2)·ZA-09(P3)·ZA-10(LOW)·ZA-11(P2). PART 2(업계 표준 벤치마크)는 이 결과를 근거로 착수한다.

---

# PART 2 — 세계 최상위 팀 기준점 (PART 1 결과 근거)

> 이 파트는 지금 실행하라는 지시가 아니라, 이후 재설계 단계의 기준선이다. 각 항목은 PART 1에서 실측한 사실만 인용한다.

## 2-A. 정보 아키텍처(IA) 설계 기준

**업계 표준 접근법:** 토스·캐시워크·캐시슬라이드류 앱테크 슈퍼앱은 하단 탭을 4~5개로 제한하고, "돈 버는" 도메인은 **단일 허브**로 통합한다 — 출석·미션·친구초대·등급 같은 하위 기능은 최상위 탭/사이드바 항목이 아니라 허브 랜딩 화면 안의 카드·섹션으로 노출된다. 이유는 세 가지다: (1) "어디서 돈을 버는가"에 대한 인지 부하를 1곳으로 최소화, (2) 신규 이벤트·미션의 발견성을 허브 상단 노출로 극대화, (3) 진입 depth를 탭(0) → 허브(1) → 세부 기능(2) 이내로 제한해 이탈을 막는다.

**현재 상태와의 격차:** PART 1-B.1·1-E에서 실측한 대로 Earn은 BottomNav 탭 1개 + `earn-subnav` 9개 chip(홈·미션·출석·친구초대·등급·혜택·캐시백·플레이·공유) + 도달 불가능한 리더보드/포지션 3개(1-B.2)로 흩어져 있다. 사용자가 원 질문에서 지적한 "9개로 흩어진 사이드바"는 실측상 정확하다. 게다가 1-B.1에서 확인했듯 이 9개 화면이 **각자** 동일한 `rpc_get_earn_hub_status`를 재호출한다 — 진짜 단일 허브였다면 한 번의 fetch를 하위 섹션이 공유했을 데이터를, 지금은 화면 전환마다 다시 요청하는 구조적 낭비까지 발생한다.

**격차의 원인:** `ACTIVE_WORK_SSOT.md`의 §AI Todo Sync(P7 Growth → E1~E23 웨이브)를 보면 각 웨이브가 "이번 기능을 위한 서프리스 1개"를 순차 추가해온 이력이 뚜렷하다 — 설계 부재가 아니라 **점진적 확장이 아직 허브형으로 수렴(consolidation)되지 않은 기술 부채**다. 각 개별 기능은 1-E에서 확인했듯 실제로 다 작동한다 — 문제는 조립 방식이다.

## 2-B. 디자인 시스템 구축 방식

**업계 표준 접근법:** Figma Variables → Style Dictionary류 도구로 코드 토큰 자동 동기화, 컴포넌트는 Storybook에 상태별(hover/disabled/loading/error)로 문서화 + Chromatic 시각 회귀, 다크/라이트는 컴포넌트 분기가 아니라 토큰 값 스왑으로 관리.

**현재 상태와의 격차:** 1-D에서 실측한 다크/라이트 처리(`light-dark()` CSS 함수 + OKLCH)는 **오히려 업계 최선단**이다 — 이 CSS 기능은 2024~2025년에야 주요 브라우저에 안착한 최신 표준으로, 대기업도 전환 중인 경우가 많다. 반면 Figma↔코드 동기화 파이프라인의 증거는 코드에 없다(코드의 `theme.css`가 유일한 SOT로 보임 — "코드 우선" 워크플로우). `package.json`(1-A에서 전문 확인)에 Storybook류 의존성이 없으며, 컴포넌트 문서화는 시각적 카탈로그가 아니라 각 서프리스의 vitest(예: `tier-me-page.test.tsx`)로 대체되어 있다 — "보여주기"가 아니라 "동작 검증" 중심.

**격차의 원인:** 설계 부재가 아니라 **팀 규모/작업 방식에 따른 우선순위 문제**로 보인다. `.cursor/rules`의 방대한 분량과 AI 에이전트 중심 개발 이력을 보면 디자이너-엔지니어 협업 파이프라인(Figma 동기화)보다 코드 직접 작성이 더 효율적인 소규모/AI-보조 개발 체제로 판단된다. Storybook 부재도 동일한 이유 — 다만 팀이 커지거나 디자이너가 합류하면 이 부재가 병목이 될 것.

## 2-C. 프론트엔드 아키텍처 기준

**업계 표준 접근법:** 서버 상태(TanStack Query류)와 클라이언트 UI 상태(최소 로컬/Zustand)를 분리하고, **모든 데이터 페칭은 타입세이프 API 클라이언트 레이어 한 곳만 통과**하게 강제한다. 컴포넌트 재사용은 프리미티브 라이브러리로, 페이지는 조합만 한다.

**현재 상태와의 격차:** state management 조합(TanStack Query 주력 + Zustand 3파일만 + `product/primitives` 63파일)은 대규모 프로덕트 표준에 **정확히 부합**한다. 그러나 "API 클라이언트 레이어 한 곳만" 원칙은 1-B.1(`ZA-05`)에서 실측한 대로 **25개 파일이 위반**하며 그중 72%가 Earn 도메인이다 — 이게 이 항목의 핵심 격차다. `callRpc()` 래퍼 자체는 이미 잘 설계되어 있다(에러를 안정된 코드로 번역) — 문제는 강제되지 않고 있다는 것.

**격차의 원인:** 표준이 없어서가 아니라 **표준(`callRpc`)이 나중에 도입됐는데 기존/병행 작성 코드가 마이그레이션되지 않은 기술 부채**다. lint 규칙으로 `supabase.rpc(` 직접 호출을 금지하는 자동 게이트가 없다는 것이 이 부채가 방치된 구조적 이유로 보인다(추정 — lint 설정 전수 확인은 본 감사 범위 밖).

## 2-D. 백엔드/DB 아키텍처 기준

**업계 표준 접근법:** 핀테크에서 Event Sourcing/append-only ledger는 보통 "돈이 실제로 이동하는 지점"에만 선택적으로 적용하는 것이 흔한 실무 절충안이다(전체 이벤트 소싱은 비용이 매우 크다). Supabase/PostgREST 생태계에서는 RLS를 1차 방어선으로 쓰는 것이 사실상 표준 패턴이며, 대형 핀테크의 애플리케이션 레이어 authorization(OPA/Casbin류)과는 다른 계열이지만 **단일 진입점(PostgREST)** 전제가 성립하면 동등하게 안전하다.

**현재 상태와의 격차:** 1-F에서 직접 판독한 append-only 해시체인 + 델타 기반 Σ=0 불변식 + 데드락 방지 잠금 순서 + TOCTOU까지 닫은 이중 멱등성 체크는 **핀테크 표준을 상회**한다(일부 상장 거래소보다 방어적). "Event Sourcing을 Wallet/Ledger에만 한정"했다는 사용자의 관찰은 정확하지만, 이는 격차가 아니라 **의도된 실용적 절충**으로 판단된다 — Casino/Sports/Mission의 상태는 mutable 컬럼으로 관리하고 ledger는 "돈이 움직이는 순간"만 기록하는 것이 업계에서도 흔한 방식이다. RLS+RPC 이중 방어(REVOKE ALL 기본값 + 명시적 GRANT, `SECURITY DEFINER`+`search_path` 고정)도 Supabase 생태계 기준 최상위 수준으로 확인됨(1-F.1·1-F.2).

**격차의 원인:** 실질적 격차 없음 — 유일한 잠재 리스크는 RLS 단일 방어선의 전제(PostgREST가 유일한 DB 진입점)가 무너질 경우인데, 이 프로젝트는 그 전제가 실제로 성립하는 구조(1-A.2에서 확인한 단일 `callRpc`/PostgREST 진입점)라 리스크는 낮다.

## 2-E. 출시 프로세스 기준

**업계 표준 접근법:** 대기업은 보통 "릴리즈 트레인" 방식으로 운영한다 — 정해진 주기로 Feature Freeze, Freeze 중 Critical Fix만 예외 허용, Regression 스위트 100% 통과, 다자(예: 3-Owner) 서명 후에만 배포, 배포 후 Post-Release Review(24h/72h/7d) 관찰.

**현재 상태와의 격차:** 놀랍게도 이 프로젝트는 **이미 정확히 이 모델을 운영 중**이다 — `PLATFORM_RELEASE_FREEZE.md`(Freeze ACTIVE), R9(런타임 매트릭스)→R10(롤아웃 소크)→R11(3-Owner 클로즈아웃)→R12(포스트릴리즈 리뷰) 단계, CI 4개 required job(quality/sql/e2e/advisors). 사용자가 물은 "12단계 릴리즈 모델이 지켜지고 있는가"에 대한 답은 **지켜지고 있다**이며, 현재 단계는 (기존 `SYSTEM_AUDIT_2026-07-13/07_RELEASE_READINESS.md` 인용) **Soft Launch 조건부 GO · Closed Beta NO-GO(근접) · Public Launch NO-GO** — Freeze ACTIVE 상태에서 PPR 24h/72h/7d 관찰과 3-Owner 서명을 기다리는 단계다. 유일한 실제 프로세스 위반은 1-A.1의 `ZA-01`(Freeze 중 migration 3건 추가)이다.

**격차의 원인:** 프로세스 설계 자체는 대기업 수준이다 — 격차가 있다면 "설계 부재"가 아니라 **실행 규율의 산발적 이탈**(`ZA-01`)이며, 이는 우선순위 문제(CI 수정이 급해 Freeze 규칙보다 앞섰을 가능성)로 보인다.

---

**PART 2 완료.**

---

# 종합 요약

## 전체 문제 수 (본 감사 신규 발견 · 심각도별)

| 심각도   |   개수 | ID                                                                                                                                         |
| -------- | -----: | ------------------------------------------------------------------------------------------------------------------------------------------ |
| P0       |      1 | ZA-05 (Earn 도메인 `callRpc` 우회 25파일·72% Earn)                                                                                         |
| P1       |      1 | ZA-07 (등급 페이지 죽은 링크 `/tier/me/history`)                                                                                           |
| P2       |      5 | ZA-01(migration drift 확대)·ZA-03(admin "구현 금지" 표기 오류)·ZA-06(오펀 라우트 3개)·ZA-08(캐시백률 이중 소스)·ZA-11(Trade 전환 지점 0개) |
| P3       |      3 | ZA-02(RPC 도메인 명명 경계 모호)·ZA-04(README 설명 부재)·ZA-09(breakpoint 토큰 중복 명명)                                                  |
| LOW      |      1 | ZA-10(PWA 배너 셸 타입 미구분)                                                                                                             |
| **합계** | **11** | —                                                                                                                                          |

기존 `SYSTEM_AUDIT_2026-07-13`(SA-01~06, 6건)과 합산하면 총 **17건**이 현재 문서화된 오늘 날짜 기준 열린 이슈다. Critical(P0급 money-safety 결함)은 0건 — ZA-05가 유일한 P0이나 이는 아키텍처 일관성 문제이며 1-F에서 확인한 실제 자금 이동 로직 자체는 안전하다.

## 도메인별 완성도 (추정 — 신뢰도 명시)

| 도메인        | 완성도 추정 | 신뢰도                       | 근거                                                                                                                 |
| ------------- | ----------: | ---------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Earn          |     **82%** | **높음**(1-E 직접 코드 판독) | 8/8 페이지 실작동, 1건 죽은 링크, 3건 도달 불가, 구조적 API 경로 불일치                                              |
| Wallet/Ledger |     **92%** | **높음**(1-F 직접 코드 판독) | 동시성·멱등성·Σ=0 로직 표본 확인 결과 최상위 수준                                                                    |
| Admin         |     **85%** | 중간(1-A 표본 확인)          | "구현 금지" 표기 페이지가 실제로는 구현되어 있음 확인(ZA-03) — 문서 신뢰도 문제, 코드 자체는 양호                    |
| Trade         |     **80%** | 낮음(기존 문서 인용 위주)    | 기존 SYSTEM_AUDIT의 R9-PERF-JS(HIGH·OPEN) 영향권 + Earn 연계 0(ZA-11) — 본 감사에서 Trade RPC 코드는 직접 판독 안 함 |
| Sports        |     **80%** | 낮음(기존 문서 인용 위주)    | 기존 감사 "Complete" 인용 — 본 감사 독자 검증 미실시                                                                 |
| Casino        |     **80%** | 낮음(기존 문서 인용 위주)    | 12종 게임 provably-fair 테스트 존재(기존 인용) — 본 감사 독자 검증 미실시                                            |

**낮은 신뢰도 도메인(Trade/Sports/Casino)은 본 감사가 시간을 집중한 Earn/Wallet 대비 코드 직접 판독량이 적어 수치 정밀도가 낮다 — 추정치이지 확정치가 아니다.**

## Earn 도메인 세부 완성도 (1-E 근거)

| 상태                  | 개수 | 비율 | 목록                                               |
| --------------------- | ---: | ---: | -------------------------------------------------- |
| 정상                  |    7 |  64% | 출석·미션·친구초대·혜택·캐시백·공유·스테이킹(허브) |
| 부분(버그 1건)        |    1 |   9% | 등급(`/tier/me`) — 죽은 링크                       |
| 페이지 정상·도달 불가 |    3 |  27% | 등급 리더보드·친구초대 리더보드·스테이킹 포지션    |

Trade/Sports/Casino 전환 지점: **Casino 3 · Sports 1 · Trade 0**(1-E.2).

## 즉시 손대면 위험한 파일 목록

| 파일                                                                                                                                                      | 위험 이유                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `supabase/migrations/20260811000001_ew_e8_financial.sql` · `20260730000001_pir_idempotency_handlers.sql` · `20260609000001_phase1_auth_wallet_ledger.sql` | Wallet/Ledger 핵심 RPC — 데드락 방지 잠금 순서·TOCTOU 방어 로직 포함, 부주의한 수정 시 이중 차감/데드락 재발 위험               |
| `supabase/migrations/20260822~20260825*_platform_sql_ci_closeout*.sql` (4개)                                                                              | Freeze ACTIVE 중 이미 드리프트 중(ZA-01) — 추가 수정은 위반 확대                                                                |
| `apps/web/src/domain/unified-tier-display-contract.ts`                                                                                                    | `EARN_HUB_STATUS_RPC` 정의처 — 4개 이상 다른 이름으로 재수출되어 15개+ 컨트롤러가 참조(ZA-05), 값 변경 시 파급 범위 예측 어려움 |
| `apps/web/src/lib/rpc.ts`                                                                                                                                 | 전체 앱의 유일한 타입세이프 RPC 진입점 — 단, 25개 파일이 이미 이를 우회하고 있어 여기만 고쳐도 전체가 안 고쳐짐                 |
| `apps/web/src/product/shell/appshell.tsx` · `shell-chrome.css`                                                                                            | 전체 앱 셸 레이아웃·BottomNav clearance 토큰 소스 — 수정 시 전 페이지 레이아웃 영향                                             |
| `apps/admin/src/product/surfaces/admin-{casino,staking,tier-benefits,promotions,cms,support}-page.tsx`                                                    | `docs/CURRENT_STATUS.md`에 "구현 금지"로 잘못 표기된 실제 운영 코드(ZA-03) — 문서만 보고 삭제/미검토 대상으로 오판 위험         |
| `supabase/migrations.lock.json`                                                                                                                           | migration 해시 lock — 위 drift와 맞물려 있어 단독 수정 시 CI parity 깨짐                                                        |

---

## 문서 상태

본 문서는 [`docs/DOCS_INDEX.md`](../DOCS_INDEX.md)에 등록 예정이며, 기존 `PLATFORM_AUDIT_REFERENCE.md`·`SYSTEM_AUDIT_2026-07-13/`·`MASTER_INVENTORY_AUDIT_2026-07-13.md`를 대체하지 않고 보완한다. 코드 수정은 이 문서 어디에도 수행되지 않았다(READ-ONLY 준수). 재설계·수정 단계는 사용자 승인 이후 별도 단계에서 진행한다.
