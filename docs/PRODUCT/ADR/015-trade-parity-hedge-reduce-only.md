# ADR-015: Trade Parity — Hedge + Reduce-Only (E21 · Closed Beta)

> **상태:** `[x]` Accepted · **날짜:** 2026-07-12  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `ew-e21-trade-parity-wave` (#254)  
> **선행:** [`ENGINE_GAP_ADR.md`](ENGINE_GAP_ADR.md) E0 **`[x]`** · E7 GATE `ew-e7-gate-engine-wave` **`[x]`**  
> **후행:** GATE `ew-e21-gate-trade-engine-parity` (#255) **`[x]` DONE** 2026-07-12 → UI `ew-e21-ui-trade-engine-unlocks` **`[x]` DONE** 2026-07-12  
> **코드 계약:** [`ew-e21-trade-parity-display-contract.ts`](../../../apps/web/src/domain/ew-e21-trade-parity-display-contract.ts)  
> **스펙 정본:** Plan §22.2.1 Tier-B · §21.1 E21 · 52차 EXISTS-RPC rescope

## Context

P9 Trade WORLD는 Tier-A(엔진 exists)를 UI wire로 닫았고, Tier-B(hedge · reduce-only · post-open TP/SL · spot limit/stop)는 E21에 남았다.  
전수 감사(52차)에서 **TP/SL amend · spot limit/stop · trailing**은 이미 RPC가 있어 **재 migration = FAIL**.  
남은 **신규**는 유저 dual-side **hedge position mode**와 **reduce-only** 주문뿐이다.

## Decision

### 1. 52차 rescope (non-waivable)

| 기능                  | 판정       | 본 WAVE                                                                                            |
| --------------------- | ---------- | -------------------------------------------------------------------------------------------------- |
| Hedge / dual-side     | **신규**   | `position_mode` + `rpc_set_position_mode` + open assert                                            |
| Reduce-only orders    | **신규**   | `trading_open_orders.reduce_only` + place/fill                                                     |
| Post-open TP/SL amend | **EXISTS** | `rpc_update_futures_position_sltp` — migration **0**                                               |
| Spot limit/stop       | **EXISTS** | `rpc_place_spot_limit_order` / `rpc_place_spot_stop_order` — migration **0** · UI unlock = GATE/UI |
| Trailing stop         | **EXISTS** | `rpc_set_trailing_stop` / `rpc_clear_trailing_stop` — migration **0** · ADR scope pin              |

> Plan 문구의 `rpc_place_limit_order`/`rpc_place_stop_order`는 **futures** 정본. Spot는 `rpc_place_spot_*`. 혼동 금지.

### 2. Position mode 정본

| 항목             | 값                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| Enum             | `position_mode` = `one_way` \| `hedge`                                                                 |
| 저장             | `margin_accounts.position_mode` DEFAULT `one_way`                                                      |
| RPC              | `rpc_set_position_mode(p_mode)` · `rpc_get_position_mode()`                                            |
| Switch block     | open futures positions **또는** active open orders 있으면 `open_positions_block` / `open_orders_block` |
| **one_way**      | 동일 market에 open이 있을 때 **반대 side** open 거부 (`position_mode_one_way_opposite`)                |
| **hedge**        | 동일 market+side 두 번째 open 거부 (`position_mode_hedge_side_exists`) · long+short 동시 허용          |
| 외부 venue hedge | **별개** (T2 B-book) — 본 ADR = 유저 dual-side UI/엔진만                                               |

Closed Beta: one_way **같은 side 스택**은 기존 soft cap 유지(테스트·레거시 호환). OKX식 netting/flip은 post-E21 backlog.

### 3. Reduce-only 정본

| 항목        | 값                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------ |
| Column      | `trading_open_orders.reduce_only BOOLEAN NOT NULL DEFAULT false`                           |
| Place       | `rpc_place_limit_order` / `rpc_place_stop_order` optional `p_reduce_only`                  |
| Place guard | 반대 side open position 없으면 `reduce_only_no_position`                                   |
| Fill        | `_fill_house_order` — 신규 position **금지** · 반대 position `_settle` / `_partial_settle` |
| Money       | unlock order margin → settle close legs → **Σ=0** (기존 settle helpers)                    |

### 4. EXISTS pin (재 migration 금지)

| RPC                                                        | Evidence                                                                                          |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `rpc_update_futures_position_sltp`                         | `20260721000007_trade_t2_futures_completion.sql` · `trade_t2_futures_sltp_test.sql`               |
| `rpc_place_spot_limit_order` / `rpc_place_spot_stop_order` | `20260721000006_trade_t1_spot_open_orders.sql` · `spot_open_orders_test.sql`                      |
| `rpc_set_trailing_stop` / `rpc_clear_trailing_stop`        | `20260722000001_trade_e_phase_e_advanced_orders.sql` · `trade_e_phase_e_advanced_orders_test.sql` |

### 5. UI unlock (WAVE vs GATE vs UI)

| 단계        | 내용                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------ |
| **본 WAVE** | ADR + migration + SQL test + display contract · `LAUNCH_GATES.tradeHedgeReduceOnlyEngine=true`               |
| **GATE**    | `test:sql` · `stack:push-remote` · advisor 0 · EXISTS spot/TP/SL/trailing 검증                               |
| **UI**      | hedge toggle · reduce-only · display `live` · `tradeParityLive` — **`[x]`** `ew-e21-ui-trade-engine-unlocks` |

WAVE 중 hedge/reduce-only UI = **built_hidden** (fake toggle FAIL). UI todo 이후 `live`.

### 6. Money / security

- Settle helpers만 사용 — client PnL 재계산 금지
- Client RPCs: `auth.uid()` · `_assert_system_live` · feature futures · rate limit
- Helpers: `REVOKE` from anon/authenticated
- Grants inventory snapshot 갱신

## Consequences

- `OKX_MARGIN_POSITION_PARITY_ACHIEVED` = **true** after E21 UI unlock
- Spot limit/stop UI는 이미 capability true — GATE는 honesty pin · 재 migration 0
- Remote apply는 GATE todo (`stack:push-remote`)

## Verification

| Gate   | 기대                                                                                                                  |
| ------ | --------------------------------------------------------------------------------------------------------------------- |
| SQL    | `ew_e21_hedge_reduce_only_test.sql` — mode switch · one_way opposite deny · hedge dual · reduce_only place/fill · Σ=0 |
| Vitest | `ew-e21-trade-parity-display-contract`                                                                                |
| Remote | GATE: `stack:push-remote` · advisor 0                                                                                 |

## Operator sign-off

Cursor Plan todo `ew-e21-trade-parity-wave` 배정·구현 지시 = 본 ADR Accepted + 동일 PR 엔진 (신규 hedge·reduce-only만).
