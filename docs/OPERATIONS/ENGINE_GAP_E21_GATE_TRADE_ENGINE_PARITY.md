# ENGINE_GAP E21 Trade Engine Parity GATE (#255)

> **상태:** `[x]` DONE · **날짜:** 2026-07-12  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `ew-e21-gate-trade-engine-parity` (#255)  
> **선행:** `ew-e21-trade-parity-wave` (#254) `[x]`  
> **후행:** `ew-e21-ui-trade-engine-unlocks`  
> **코드 계약:** [`ew-e21-gate-trade-engine-parity-display-contract.ts`](../../apps/web/src/domain/ew-e21-gate-trade-engine-parity-display-contract.ts)

## 범위

| 항목       | 내용                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------- |
| SQL        | `ew_e21_hedge_reduce_only_test.sql` E21-0..E21-4 · hedge · reduce-only · Σ=0 · **CI sql authoritative** (G13) |
| Remote     | `stack:push-remote` · migration name `ew_e21_trade_parity_hedge_reduce_only`                                  |
| Advisor    | security advisor **0 ERROR**                                                                                  |
| EXISTS pin | TP/SL amend · spot limit/stop · trailing — remigration **0**                                                  |
| Spot UI    | limit/stop **이미 live** (`TRADE_SPOT_UI_CAPABILITIES` · `spot_limit_tab=live`) — honesty 증거만              |
| Tier-B UI  | `tradeParityLive=false` · hedge/reduce-only **built_hidden/disabled** until UI todo                           |

## Unlock / honesty 상세

| Surface                    | 상태                  | 비고                                                                       |
| -------------------------- | --------------------- | -------------------------------------------------------------------------- |
| Spot limit/stop tabs       | **live** (EXISTS RPC) | `rpc_place_spot_limit_order` · `rpc_place_spot_stop_order` · GATE 증거 pin |
| Post-open TP/SL edit       | **live** (EXISTS RPC) | `rpc_update_futures_position_sltp`                                         |
| Trailing stop              | **live** (EXISTS RPC) | `rpc_set_trailing_stop` / clear                                            |
| Hedge position mode toggle | **built_hidden**      | UI todo · `tradeParityLive`                                                |
| Reduce-only toggle         | **built_disabled**    | UI todo · `tradeParityLive`                                                |

## 증거

| Gate                             | 결과                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| vitest E21 GATE + WAVE contracts | **5/5**                                                                                              |
| typecheck · i18n · release       | green                                                                                                |
| Remote migration                 | `ew_e21_trade_parity_hedge_reduce_only` (tail `20260711160355`)                                      |
| Advisor                          | **0 ERROR** (`stack:push-remote`)                                                                    |
| Spot unlock honesty              | `isSpotLimitStopUiUnlockedViaExistingRpc() = true`                                                   |
| GATE ready                       | `isEwE21TradeEngineParityGateReady() = true` · `tradeParityLive=false`                               |
| SQL                              | `ew_e21_hedge_reduce_only_test.sql` E21-0..E21-4 · **CI sql authoritative** (G13 · local heavy deny) |

## 다음

`ew-e21-ui-trade-engine-unlocks` — hedge toggle · reduce-only · display `live` · `LAUNCH_GATES.tradeParityLive=true` — **`[x]` DONE** 2026-07-12 · next `ew-e22-sports-parity-wave`.
