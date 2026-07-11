# ENGINE_GAP E21 Trade Parity (#254)

> **상태:** `[x]` DONE · **날짜:** 2026-07-12  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `ew-e21-trade-parity-wave` (#254)  
> **ADR:** [`015-trade-parity-hedge-reduce-only.md`](../PRODUCT/ADR/015-trade-parity-hedge-reduce-only.md)  
> **코드 계약:** [`ew-e21-trade-parity-display-contract.ts`](../../apps/web/src/domain/ew-e21-trade-parity-display-contract.ts)  
> **선행:** E7 GATE `#253` `[x]`  
> **후행:** `ew-e21-gate-trade-engine-parity` (#255) **`[x]` DONE** 2026-07-12 · 다음 `ew-e21-ui-trade-engine-unlocks`

## 범위 (52차 rescope)

| 항목                 | 내용                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------- |
| ADR                  | hedge dual-side · reduce-only · EXISTS pin (TP/SL · spot · trailing)                         |
| Migration            | `20260808000001_ew_e21_trade_parity_hedge_reduce_only.sql` (**신규만**)                      |
| NEW RPCs             | `rpc_set_position_mode` · `rpc_get_position_mode` · place `p_reduce_only` · fill reduce path |
| EXISTS (migration 0) | `rpc_update_futures_position_sltp` · `rpc_place_spot_*` · `rpc_set_trailing_stop`            |
| Launch               | `LAUNCH_GATES.tradeHedgeReduceOnlyEngine=true` · `tradeParityLive=false`                     |

## 증거

| Gate                               | 결과                                                                               |
| ---------------------------------- | ---------------------------------------------------------------------------------- |
| `gate:ai-impl` ew-e21-trade-parity | vitest display-contract · typecheck · lint · i18n · release                        |
| SQL                                | `ew_e21_hedge_reduce_only_test.sql` E21-0..E21-4 · **CI sql authoritative** (G13)  |
| Remote                             | GATE `#255` **`[x]`**: `stack:push-remote` · advisor **0** · tail `20260711160355` |

## 다음

`ew-e21-ui-trade-engine-unlocks` — GATE `#255` **`[x]` DONE** 2026-07-12 — hedge/reduce-only UI · `tradeParityLive` — **`[x]` DONE** 2026-07-12 · next `ew-e22-sports-parity-wave`.
