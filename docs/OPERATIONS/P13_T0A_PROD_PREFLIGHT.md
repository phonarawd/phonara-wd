# P13 T0-A Prod Preflight Checklist (§20.14)

> **상태:** Active OPS canon · **날짜:** 2026-07-11  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `p13-ops-prod-preflight` (#232)  
> **선행:** `p13-admin-ops-push` (#231) **`[x]`**  
> **후행:** `p13-soft-launch-bundle` (#233)  
> **코드 계약:** [`p13-ops-prod-preflight-display-contract.ts`](../../apps/admin/src/domain/p13-ops-prod-preflight-display-contract.ts)  
> **Spotcheck:** [`scripts/p13-ops-prod-preflight-spotcheck.sql`](../../scripts/p13-ops-prod-preflight-spotcheck.sql)  
> **엔진 경계:** migration · `packages/*-engine` **코드 diff 0** (non-waivable)

본 문서는 Soft Launch **직전** 원격(prod) 운영 체크리스트 정본이다.  
Closed Beta 숫자·입출금 리허설은 **후행** `p13-soft-launch-bundle` · [`ENGINE_CLOSED_BETA_SCENARIO_MATRIX.md`](../ENGINE_CLOSED_BETA_SCENARIO_MATRIX.md).

---

## 1. 30초 요약

| 항목 | T0-A 의미 | Soft Launch 전까지 |
| ---- | --------- | ------------------ |
| pg_cron live | 14 job **active** | 유지 |
| price-feed Vault | `price_feed_url` · `price_feed_invoke_key` 존재 | `stack:verify-worldno1-edge` |
| insurance/treasury seed | 계정·통화 **row 존재** | 자본 주입·실잔액은 CB 전 operator |
| OI/leverage defaults | futures 컬럼 · `max_open_positions_per_user=50` | CB는 5x · OI 50%로 조임 |
| MFA AAL2 | `_assert_admin_aal2` + Admin enroll | 운영자 TOTP 등록 |
| feature gate 초기 | cross·funding **false** | T1 ramp에서만 개방 |
| 코드 diff 0 | 본 todo = DOC/OPS only | migration 금지 |

---

## 2. 체크리스트 (7섹션)

### 2.1 pg_cron live

```powershell
# Dashboard SQL 또는 spotcheck 스크립트
# scripts/p13-ops-prod-preflight-spotcheck.sql
```

| Job | Schedule | 필수 |
| --- | -------- | ---- |
| `phonara_auto_liquidations` | `* * * * *` | ✅ |
| `phonara_ops_notify` | `* * * * *` | ✅ |
| `phonara_ops_notify_digest` | `0 3,13 * * *` | ✅ |
| `phonara_casino_stale_pending_sweep` | `*/5 * * * *` | ✅ |
| `phonara_daily_reconciliation` | `0 2 * * *` | ✅ |
| `phonara_price_feed` | `* * * * *` | ✅ |
| `phonara_phon_internal_oracle` | `* * * * *` | ✅ |
| `phonara_crypto_chain_watcher` | `* * * * *` | ✅ |
| `phonara_usdt_krw_feed` | `* * * * *` | ✅ |
| `phonara_notification_dispatch` | `* * * * *` | ✅ |
| `trade-open-order-fills` | `* * * * *` | ✅ |
| `trade-spot-order-fills` | `* * * * *` | ✅ |
| `trade-stop-orders` | `* * * * *` | ✅ |
| `trade-funding-accrual` | `5 * * * *` | ✅ (settlement는 feature gate로 차단) |

| # | 확인 | 완료 |
| - | ---- | ---- |
| C1 | 위 14 job 전부 `active=true` | [ ] |
| C2 | `cron.job_run_details` 최근 실행 실패 폭주 없음 | [ ] |

### 2.2 price-feed Vault

| Secret | 용도 |
| ------ | ---- |
| `price_feed_url` | Edge `price-feed` invoke URL |
| `price_feed_invoke_key` | service/anon invoke key (Vault only) |

```powershell
bun run stack:verify-worldno1-edge
```

| # | 확인 | 완료 |
| - | ---- | ---- |
| V1 | Vault에 두 secret **이름** 존재 (값 노출 금지) | [ ] |
| V2 | `stack:verify-worldno1-edge` exit 0 · `price-feed` HTTP OK | [ ] |

### 2.3 insurance / treasury seed

| 대상 | 기대 |
| ---- | ---- |
| `system_accounts.insurance_fund_phon` · `_usdt` | **row 존재** |
| `operator_contributed_capital_*` | row 존재 (주입 전 balance 0 OK) |
| `treasury_reserves` PHON/USDT/KRW | **row 존재** · `buffer_pct` 기본 10 |
| 자본 주입 | `rpc_contribute_insurance_capital` (AAL2) — **CB 전** |
| 실잔액 | `rpc_update_treasury_reserve` (AAL2) — **CB 전** |

| # | 확인 | 완료 |
| - | ---- | ---- |
| I1 | insurance_fund_* 2행 | [ ] |
| I2 | treasury_reserves 3통화 | [ ] |
| I3 | (Soft Launch) insurance ≥ OI×20% USDT · treasury 실잔액 기입 | [ ] ← soft-launch |

### 2.4 OI / leverage defaults

| 항목 | Seed 기본 | Closed Beta 목표 (§20.14.5) |
| ---- | --------- | --------------------------- |
| `max_open_positions_per_user` | `50` | 유지 또는 축소 |
| majors `max_leverage` | `20` | **5** (soft-launch 조임) |
| majors `max_open_interest` | `500000.000000` | utilization **50%** |
| `PHONUSDT-PERP` leverage / OI | `10` / `100000` | CB 정책에 맞게 조임 |
| insurance | — | OI × **20%** USDT |

| # | 확인 | 완료 |
| - | ---- | ---- |
| O1 | active futures에 `max_leverage` · `max_open_interest` non-null | [ ] |
| O2 | `max_open_positions_per_user=50` | [ ] |
| O3 | (Soft Launch) CB 5x · OI 50% 적용 | [ ] ← soft-launch |

### 2.5 MFA AAL2

| 계층 | 정본 |
| ---- | ---- |
| SQL | `_assert_admin_aal2()` — 고위험 admin RPC |
| UI | `/admin/mfa/enroll` · `/admin/mfa/challenge` (P3 DONE) |
| Auth | Dashboard MFA TOTP ON ([`setup/MANUAL_TASKS.md`](../../setup/MANUAL_TASKS.md) §3) |

| # | 확인 | 완료 |
| - | ---- | ---- |
| M1 | 운영자 Admin 계정 TOTP 등록 | [ ] |
| M2 | AAL2 세션으로 `/overview` 접근 | [ ] |
| M3 | AAL1로 고위험 RPC → `ERR_MFA_REQUIRED` | [ ] |

### 2.6 feature gate 초기 (Plan §20.14.7)

| Key | T0-A 기대 |
| --- | --------- |
| `feature_cross_margin_enabled` | **`false`** |
| `feature_funding_enabled` | **`false`** (정산 OFF · cron은 살아도 OK) |
| `system_halt` | `false` |
| `system_readonly` | `false` |
| Tier-B trade UI (hedge · reduce-only) | **built_hidden** (app_config 키 없음 · E21까지) |

플랫폼 rails (`feature_spot/futures/game/sports/deposit`) = soft-launch 준비 시 **true** 가능.  
`feature_withdrawal_enabled` = operator 승인 전 **false 권장** ([`MANUAL_TASKS.md`](../../setup/MANUAL_TASKS.md) §11).

| # | 확인 | 완료 |
| - | ---- | ---- |
| F1 | cross margin = false | [ ] |
| F2 | funding settlement = false | [ ] |
| F3 | halt/readonly = false | [ ] |
| F4 | Tier-B UI 노출 0 (Trade) | [ ] |

### 2.7 코드 diff 0

| # | 확인 | 완료 |
| - | ---- | ---- |
| D1 | 본 todo PR에 `supabase/migrations/**` 변경 **0** | [ ] |
| D2 | `packages/*-engine` 변경 **0** | [ ] |
| D3 | 산출물 = docs · display-contract · spotcheck SQL only | [ ] |

---

## 3. Live audit (prod · 2026-07-11 · read-only MCP)

프로젝트: `yocjhjsdwoijfdrehzoq`

| 섹션 | 결과 | 비고 |
| ---- | ---- | ---- |
| **pg_cron** | **PASS** 14/14 active | schedules 표 §2.1과 일치 |
| **price-feed Vault** | **PASS** `price_feed_url` · `price_feed_invoke_key` | 값 미조회 |
| **insurance rows** | **PASS** 2행 | balance **0** · **실입금/자본 주입 DEFER** (아래 §3.1) |
| **treasury rows** | **PASS** PHON/USDT/KRW | `real_balance=0` · **실입금 DEFER** (아래 §3.1) |
| **OI/leverage** | **PASS** CB 적용 | lev **5** · majors OI **250k** · PHON **50k** (seed 50%) |
| **cross margin** | **PASS** `false` | |
| **funding gate** | **PASS** `false` | 2026-07-11 agent set (T0-A 정책) |
| **withdrawal** | **PASS** `false` | 2026-07-11 agent set (Launch-Ops 권고) |
| **halt/readonly** | **PASS** false | |
| **admin_role_grants** | empty | **MFA enroll DEFER** (아래 §3.1) |
| **코드 diff 0** | **PASS** | 본 산출물 migration 0 |
| **Vault/edge verify** | **PASS** | `stack:verify-worldno1-edge` price-feed HTTP 200 |

**판정:** T0-A **인프라 hard checks PASS** · funding/withdrawal OFF · CB leverage/OI 적용됨.

### 3.1 Operator DEFER (2026-07-11 · 명시 보류 · soft-launch blocker 아님)

> **operator 지시:** 아래 2항은 **나중으로 미룸**. Soft Launch UI/QA(`p13-soft-launch-bundle`)는 **이 DEFER와 독립**으로 진행 가능. 실거래 GO / 실돈 CB 직전에만 재개.

| # | 항목 | 보류 이유 | 재개 조건 | 상태 |
| - | ---- | --------- | --------- | ---- |
| D1 | **Admin MFA enroll + AAL2 smoke** | Supabase MFA/관련 기능 **유료 결제** 필요 | Pro(또는 MFA 가능 플랜) 결제 후 · MANUAL_TASKS §3-1 | **`[ ]` DEFER** |
| D2 | **실입금 · insurance 자본 주입 · treasury real_balance** | 실돈 입금·시드 자본 **나중** | operator 금액 확정 + `rpc_contribute_insurance_capital` · `rpc_update_treasury_reserve` | **`[ ]` DEFER** |

적용 완료 (보류 아님):

1. ~~`feature_funding_enabled` → `false`~~ **`[x]`** 2026-07-11
2. ~~`feature_withdrawal_enabled` → `false`~~ **`[x]`** 2026-07-11
3. ~~futures max_leverage → 5 · OI 50%~~ **`[x]`** 2026-07-11 — majors OI `250000` · PHON `50000` · lev `5`

---

## 4. 명령 치트시트

```powershell
Set-Location c:\Users\PC\Desktop\phonara-gb

# Edge + Vault sync (price-feed 포함)
bun run stack:verify-worldno1-edge

# 계약 게이트
bun run gate:ai-impl -- --test apps/admin/src/domain/__tests__/p13-ops-prod-preflight-display-contract.test.ts

# SQL spotcheck (Dashboard / service_role — agent 로컬 test:sql 금지)
# scripts/p13-ops-prod-preflight-spotcheck.sql
```

---

## 5. 교차 참조

| 문서 | 용도 |
| ---- | ---- |
| [`PRE_LAUNCH_CHECKLIST_BEGINNER.md`](PRE_LAUNCH_CHECKLIST_BEGINNER.md) | 왕초보 L0–L2 |
| [`setup/MANUAL_TASKS.md`](../../setup/MANUAL_TASKS.md) §11 | Launch-Ops 당일 루프 |
| [`TRADE_DESK_T0_ORACLE_OPS_RUNBOOK.md`](TRADE_DESK_T0_ORACLE_OPS_RUNBOOK.md) | Oracle T0-e (별칭 T0 — Trade desk) |
| [`ENGINE_CLOSED_BETA_SCENARIO_MATRIX.md`](../ENGINE_CLOSED_BETA_SCENARIO_MATRIX.md) | CB-01~06 |
| Plan §20.14 | Go/No-Go · Wave 매핑 |

---

**Implemented:** display-contract · spotcheck · 본 canon · live audit 표 · §3.1 MFA/실입금 **DEFER**  
**다음:** `p13-soft-launch-bundle` — UI/QA (MFA·실입금 DEFER와 독립)
