# 플랫폼 감사 B — RPC 계약 / 에러 매핑 / RLS SELECT / Realtime publication

> **일자:** 2026-07-08 · **범위:** Section B (읽기 전용) · **선행:** `pqa-audit-a-db-guards` `[x]`  
> **판정 태그:** `PASS` / `FAIL` / `P1` / `P2` / `P3` / `UNVERIFIED` (`30-audit-discipline`)

---

## 실행 요약

| 항목                                 | 정적 스캔 (repo)     | 원격 prod (MCP)              | 최종 판정             |
| ------------------------------------ | -------------------- | ---------------------------- | --------------------- |
| Web client RPC 고유                  | **61** (호출부 119)  | 샘플 10/10 live              | **PASS** (존재)       |
| Admin client RPC 고유                | **52** (호출부 84)   | 샘플 10/10 live              | **PASS** (존재)       |
| 인자↔live 시그니처 1:1 (전수)        | Docker OFF           | 부분 교차검증                | **UNVERIFIED** (로컬) |
| PGRST202/300 후보 (정적)             | **0건**              | —                            | **PASS** (정적)       |
| `translate-error` Phase E 7종 미매핑 | **7건** 확정         | —                            | **P2**                |
| `market_not_found` 중복 needle       | **2건**              | —                            | **P2**                |
| `affiliate_self_forbidden` 오매핑    | `forbidden` 선매칭   | —                            | **P2**                |
| `.from(table)` authenticated SELECT  | 44 테이블            | 11 핵심 테이블 **전부 true** | **PASS**              |
| Realtime 구독↔`supabase_realtime`    | 16 구독              | **10건 누락**                | **P1**                |
| `database.types.ts` RPC drift        | `rpc_run_*` 2종 누락 | —                            | **P2**                |

**재현 스크립트 (Docker ON 시 live 시그니처·publication 포함):**

```powershell
bun run tsx scripts/audit/audit-b-rpc-contract.ts
```

**산출 JSON:** `scripts/audit/last-b-rpc-contract-report.json`

**세션:** Docker Desktop 미기동 → 로컬 `pg_proc`/`pg_publication_tables` 재현 **UNVERIFIED**. 원격 MCP `execute_sql` (project `yocjhjsdwoijfdrehzoq`)로 prod 교차검증 완료.

---

## 1. Client RPC 인벤토리 (web 61 · admin 52)

Plan 사전조사(58+44) 대비 **실측 ≥ 목표**. 스캐너: `scripts/audit/audit-b-rpc-contract.ts` — `callRpc` · `supabase.rpc` · `sportsRpc` · `as never` 캐스트 · bound `rpc()` 포함.

### 1.1 Web (61 고유 · 근거 JSON `rpcInventory.web`)

| 도메인  | 대표 RPC                                                                      | evidence (1줄)                                                   |
| ------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Trade   | `rpc_get_candles` … `rpc_claim_staking_reward` (23)                           | `apps/web/src/hooks/use-trading.ts:325+`                         |
| Sports  | `rpc_place_sports_bet` · `rpc_cashout_sports_bet` · `rpc_list_my_sports_bets` | `apps/web/src/features/sports/use-sports-betting.ts:48+`         |
| Wallet  | `rpc_request_withdrawal` · `rpc_list_withdrawal_addresses`                    | `apps/web/src/domain/wallet.ts` · `use-crypto-withdraw.ts:49+`   |
| Earn    | `rpc_get_earn_hub_status` · `rpc_claim_daily_reward`                          | `apps/web/src/features/earn/*`                                   |
| Casino  | `rpc_open_game_round` · `rpc_place_game_bet`                                  | `apps/web/src/features/casino/use-casino-round.ts:127+`          |
| CMS     | `rpc_list_cms_content`                                                        | `apps/web/src/hooks/use-cms-content.ts:25`                       |
| Account | `rpc_request_account_deletion`                                                | `apps/web/src/features/account/use-account-hub-controller.ts:83` |

### 1.2 Admin (52 고유 · 근거 JSON `rpcInventory.admin`)

| 도메인       | 대표 RPC                                                                      | evidence                                               |
| ------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------ |
| Ops          | `rpc_admin_get_ops_dashboard` · `rpc_admin_halt_market` · `rpc_resume_market` | `apps/admin/src/domain/ops.ts:58+`                     |
| Queues       | `rpc_approve_withdrawal` · `rpc_review_kyc_submission`                        | `apps/admin/src/domain/queues.ts`                      |
| Sports admin | `rpc_void_sports_market` · `rpc_admin_set_sports_risk_tier`                   | `apps/admin/src/hooks/admin/useAdminSports.ts:258+`    |
| Access       | `rpc_admin_list_role_grants` · `rpc_admin_set_mfa_policy`                     | `apps/admin/src/hooks/admin/useAdminAccessDesk.ts:95+` |

---

## 2. 호출 인자 ↔ live 시그니처 (PGRST202/300 차단)

### 2.1 정적 판정 (Docker OFF)

| 검사                                                  | 결과                                                          | 근거                                          |
| ----------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------- |
| Client RPC 이름이 `database.types` `Functions`에 없음 | **0건** (스캔된 61+52 전부 타입 키 존재 또는 `as never` 우회) | `packages/shared-types/src/database.types.ts` |
| 정적 extra/missing required args (literal 호출만)     | **0건**                                                       | JSON `rpcContractGaps: []`                    |
| 오버로드 혼동 위험                                    | **관찰 2종**                                                  | 아래 2.2                                      |

### 2.2 Prod live 시그니처 교차검증 (MCP 2026-07-08)

**`rpc_spot_market_buy` — dual overload (정상 · PostgREST 오버로드 해석):**

| overload args (live)                                        | client 호출           | 판정     |
| ----------------------------------------------------------- | --------------------- | -------- |
| `p_usdt_spent, p_client_request_id`                         | `use-trading.ts:1425` | **PASS** |
| `p_market, p_stake_currency, p_amount, p_client_request_id` | `use-trading.ts:1437` | **PASS** |

근거: MCP `pg_get_function_identity_arguments` · `apps/web/src/hooks/use-trading.ts:1425–1442`

**`rpc_get_earn_hub_status`:**

| live args     | client                                                                             | 판정               |
| ------------- | ---------------------------------------------------------------------------------- | ------------------ |
| `()` (무인자) | 대부분 무인자 호출                                                                 | **PASS**           |
| —             | 스캐너가 `p_lane` 오탐 1건 (`use-home-attendance-page-controller.ts:58` 인접 블록) | **P3** 스캐너 한계 |

**`rpc_place_spot_limit_order`:**

| live args                                                                          | client                                                    | 판정                                    |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------- |
| `p_market, p_side, p_stake_currency, p_amount, p_limit_price, p_client_request_id` | `use-trading.ts:1490` (dynamic 블록 · literal 추출 empty) | **UNVERIFIED** (런타임 typed `callRpc`) |

### 2.3 `database.types.ts` drift (P2)

| RPC                        | live (prod) | types                           | gap                                                        |
| -------------------------- | ----------- | ------------------------------- | ---------------------------------------------------------- |
| `rpc_run_stop_orders`      | EXISTS      | **누락**                        | cron/service 전용 · client 미호출 — **P2**                 |
| `rpc_run_open_order_fills` | EXISTS      | **누락**                        | 동일 — **P2**                                              |
| `rpc_spot_market_buy`      | 2 overload  | 단일 엔트리·전부 optional merge | **P2** (동작 OK · 재생성 파이프라인 `pqa-fix-types-regen`) |

근거: `packages/shared-types/src/database.types.ts` Grep `rpc_run_stop_orders` 0건 · MCP live EXISTS.

---

## 3. RAISE EXCEPTION ↔ `translate-error` needle 시뮬레이션

정본: `apps/web/src/lib/translate-error.ts:7–112` (104 needles · substring 순서 매칭).  
Admin 앱: 별도 `translate-error` **없음** — `apps/admin/src/lib/rpc.ts` `RPC_ERROR_CODES` 12종 한정 (`80-release-readiness` P2).

### 3.1 Plan §33.3 확정 후보 (7+1)

| code                                 | migration 근거                                                | 시뮬레이션 결과               | i18n key                         | 심각도 |
| ------------------------------------ | ------------------------------------------------------------- | ----------------------------- | -------------------------------- | ------ |
| `order_not_found`                    | `20260722000001_trade_e_phase_e_advanced_orders.sql:134`      | **미매핑** → `error.UNKNOWN`  | —                                | **P2** |
| `post_only_would_cross`              | 동일 `:264`                                                   | **미매핑**                    | —                                | **P2** |
| `invalid_time_in_force`              | 동일 `:64`                                                    | **미매핑**                    | —                                | **P2** |
| `market_hedge_blocked`               | `20260616000108_wave_s13_sportsbook_anti_arb_defense.sql:210` | **미매핑**                    | —                                | **P2** |
| `sports_user_banned`                 | 동일 `:138`                                                   | **미매핑**                    | —                                | **P2** |
| `withdrawal_address_not_whitelisted` | `20260629000001_worldno1_vertical_hardening.sql:61`           | **미매핑**                    | —                                | **P2** |
| `geo_blocked`                        | `20260627000001_worldno1_money_ops_rails.sql:765`             | **미매핑**                    | —                                | **P2** |
| `affiliate_self_forbidden`           | `20260611000074_affiliate_relationships_depth.sql:57`         | needle `forbidden` **선매칭** | `error.FORBIDDEN` (전용 키 없음) | **P2** |

JSON `errorMapping.phaseECandidates` 7종과 일치.

### 3.2 `market_not_found` 중복 needle (P2)

```56:66:apps/web/src/lib/translate-error.ts
  ['market_not_found', 'error.INVALID_INPUT'],
  // ...
  ['market_not_found', 'error.SPORTS_FIXTURE_CLOSED'],
```

| 시뮬레이션                | 결과                                          |
| ------------------------- | --------------------------------------------- |
| `error: market_not_found` | **첫 매칭** → `error.INVALID_INPUT`           |
| 스포츠 컨텍스트 의도      | `error.SPORTS_FIXTURE_CLOSED` (**도달 불가**) |

판정: **P2** — `pqa-fix-error-mapping` 큐.

### 3.3 미매핑 전체 규모

- Migration 추출 stable code: **294** (내부/admin 전용 포함)
- `translate-error` 미매핑: **190** (JSON `unmappedErrorCount`)
- **Client-facing 우선 수정:** §3.1 표 7종 + Phase E trade 3종

---

## 4. Client `.from(table)` ↔ RLS SELECT

스캔: web+admin **44** public 테이블 (storage `kyc-documents` 제외).

### 4.1 Prod `has_table_privilege` (MCP · 11 핵심 trade/wallet)

| table                 | RLS ON | auth SELECT | anon SELECT | client files                          |
| --------------------- | ------ | ----------- | ----------- | ------------------------------------- |
| `wallets`             | Y      | **Y**       | N           | `use-wallet.ts:31`                    |
| `wallet_ledger`       | Y      | **Y**       | N           | `use-wallet.ts:63`                    |
| `oracle_prices`       | Y      | **Y**       | Y           | `use-trading.ts:416`                  |
| `price_ticks`         | Y      | **Y**       | Y           | `use-trading.ts:381`                  |
| `futures_positions`   | Y      | **Y**       | N           | `use-trading.ts:527`                  |
| `spot_open_orders`    | Y      | **Y**       | N           | `use-trading.ts:598`                  |
| `trading_open_orders` | Y      | **Y**       | N           | `use-trading.ts:562`                  |
| `staking_positions`   | Y      | **Y**       | N           | `use-trading.ts:1577`                 |
| `profiles`            | Y      | **Y**       | N           | `use-profile.ts:17`                   |
| `missions`            | Y      | **Y**       | N           | `use-earn-home-page-controller.ts:56` |
| `app_config`          | Y      | **Y**       | Y           | `use-platform-gates.ts:21`            |

**판정:** authenticated SELECT gap **0** (표본). 전체 44 테이블 live 핀은 Docker ON 후 `audit-b-rpc-contract.ts` 재실행으로 마감.

---

## 5. Realtime 구독 ↔ `pg_publication_tables`

### 5.1 Prod `supabase_realtime` (MCP)

**포함 (6):** `crypto_deposit_requests` · `giftcard_deposit_requests` · `krw_deposit_requests` · `sports_fixtures` · `sports_markets` · `sports_odds_snapshots`

근거: `20260706000001_sports_realtime_publication.sql` · `20260710000001_deposit_notify_e6.sql`

### 5.2 Client `useRealtime` 구독 (16) — publication 누락 (P1)

| table                 | 구독 근거                             | in `supabase_realtime` (prod) | 심각도 |
| --------------------- | ------------------------------------- | ----------------------------- | ------ |
| `oracle_prices`       | `use-trading.ts:495`                  | **N**                         | **P1** |
| `price_ticks`         | `use-trading.ts:395`                  | **N**                         | **P1** |
| `wallets`             | `use-wallet.ts:41`                    | **N**                         | **P1** |
| `wallet_ledger`       | `use-wallet.ts:74`                    | **N**                         | **P1** |
| `spot_open_orders`    | `use-trade-realtime-feedback.ts:159`  | **N**                         | **P1** |
| `trading_open_orders` | `use-trade-realtime-feedback.ts:166`  | **N**                         | **P1** |
| `futures_positions`   | `use-trade-realtime-feedback.ts:173`  | **N**                         | **P1** |
| `spot_order_fills`    | `use-trade-realtime-feedback.ts:180`  | **N**                         | **P1** |
| `trading_order_fills` | `use-trade-realtime-feedback.ts:187`  | **N**                         | **P1** |
| `staking_positions`   | `use-trading.ts:1587`                 | **N**                         | **P1** |
| deposit 3종           | `use-deposit-realtime-notify.ts:119+` | **Y**                         | PASS   |
| sports 3종            | `use-sports-realtime.ts:105+`         | **Y**                         | PASS   |

**영향:** 구독 채널은 연결되나 **postgres_changes 이벤트 미전달** → trade/wallet 실시간 invalidate·피드백 **무동작**.  
**수정 큐:** `launch-engine-e5-realtime-publication` (F5 · engine-p0 RED-first) — Plan §33.3 #2.

---

## 6. 계약 gap 표 (B 산출 · 심각도순)

| id                         | 심각도 | gap                                                           | 근거                                      | 수정 큐                                 |
| -------------------------- | ------ | ------------------------------------------------------------- | ----------------------------------------- | --------------------------------------- |
| `rt-pub-trade-wallet`      | **P1** | trade/wallet 10 테이블 publication 누락                       | §5.2 · MCP prod                           | `launch-engine-e5-realtime-publication` |
| `err-phase-e-7`            | **P2** | Phase E+sports+출금+geo 7종 미매핑                            | §3.1 · `translate-error.ts`               | `pqa-fix-error-mapping`                 |
| `err-market-not-found-dup` | **P2** | `market_not_found` needle 2중 · sports 키 도달 불가           | `translate-error.ts:56,66`                | `pqa-fix-error-mapping`                 |
| `err-affiliate-self`       | **P2** | `affiliate_self_forbidden` → generic `forbidden`              | `translate-error.ts:59` · migration `:57` | `pqa-fix-error-mapping`                 |
| `types-rpc-run-missing`    | **P2** | `rpc_run_stop_orders` · `rpc_run_open_order_fills` types 누락 | `database.types.ts` Grep                  | `pqa-fix-types-regen`                   |
| `admin-no-translate-error` | **P2** | admin 52 RPC · 전용 error map 없음                            | `apps/admin/src/lib/rpc.ts:13–26`         | `pqa-fix-error-mapping` (admin)         |
| `scanner-earn-hub-arg`     | **P3** | 스캐너 `rpc_get_earn_hub_status` 오탐 `p_lane`                | JSON inventory                            | 스캐너 개선 (선택)                      |

**PGRST202/300 정적 후보:** **0건** (이번 스캔 범위). Live 전수 1:1는 Docker ON 재실행 **UNVERIFIED**.

---

## 7. UNVERIFIED

| 항목                               | 이유                                   |
| ---------------------------------- | -------------------------------------- |
| 로컬 `pg_proc` 전 RPC 인자 대조    | Docker Desktop OFF                     |
| `rpc_place_spot_*` literal 인자 핀 | dynamic/멀티라인 · 타입 `callRpc` 위임 |
| `.from()` 44테이블 전수 SELECT     | prod 11테이블만 핀                     |
| Admin error path E2E               | G13 — CI 위임                          |

---

## 8. C 착수 게이트

- [x] B 계약 gap 표 + JSON 산출 + 재현 스크립트
- [x] A 선행 `[x]` (`PLATFORM_AUDIT_A_DB_GUARDS_2026-07-08.md`)
- [x] Prod publication·SELECT 교차검증 (MCP)
- [ ] Docker ON 시 `audit-b-rpc-contract.ts` 1회 — live 시그니처·publication 로컬 핀 (operator · ~1분)

**`pqa-audit-c-surface-controls` 착수 가능** — dead control·i18n parity는 surface 읽기 전용으로 진행.

---

## 교차 참조

- Plan: `phase_r_super-app_8bdf2c10` §33.2 #B
- 선행: `docs/audit/PLATFORM_AUDIT_A_DB_GUARDS_2026-07-08.md`
- 스크립트: `scripts/audit/audit-b-rpc-contract.ts`
- JSON: `scripts/audit/last-b-rpc-contract-report.json`
- 수정 큐: `pqa-fix-error-mapping` · `launch-engine-e5-realtime-publication` · `pqa-fix-types-regen`
