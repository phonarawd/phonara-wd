# ENGINE_GAP E22 Sports Parity

> **상태:** `[x]` DONE · **날짜:** 2026-07-12  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `ew-e22-sports-parity-wave`  
> **ADR:** [`016-sports-parity-partial-cashout.md`](../PRODUCT/ADR/016-sports-parity-partial-cashout.md)  
> **코드 계약:** [`ew-e22-sports-parity-display-contract.ts`](../../apps/web/src/domain/ew-e22-sports-parity-display-contract.ts)  
> **선행:** E21 UI `ew-e21-ui-trade-engine-unlocks` `[x]`  
> **후행:** `ew-e22-gate-sports-parity` **`[x]` DONE** 2026-07-12 → `ew-e22-ui-sports-parity-unlocks`

## 범위 (52차 rescope)

| 항목                 | 내용                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| ADR                  | partial cashout · odds acceptance · correct_score · catalog · vendor pin · EXISTS full cashout                                  |
| Migration            | `20260809000001_ew_e22_sports_parity.sql` (**신규만**)                                                                          |
| NEW RPCs             | `rpc_preview_sports_partial_cashout` · `rpc_partial_cashout_sports_bet` · `rpc_list_sports_catalog` · place `p_odds_acceptance` |
| EXISTS (migration 0) | `rpc_preview_sports_cashout` · `rpc_cashout_sports_bet`                                                                         |
| Same-PR UI           | My-bets **전액** cashout card (`p10-sports-slip-advanced-wire` honesty)                                                         |
| Launch               | `LAUNCH_GATES.sportsParityEngine=true` · `sportsParityLive=false`                                                               |
| Defer                | correlated bet-builder · vendor feed worker                                                                                     |

## 증거

| Gate                                | 결과                                                                          |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| `gate:ai-impl` ew-e22-sports-parity | vitest display-contract · cashout UI · typecheck · i18n · release             |
| SQL                                 | `ew_e22_sports_parity_test.sql` E22-0..E22-4 · **CI sql authoritative** (G13) |
| Remote                              | GATE **`[x]`**: `stack:push-remote` · advisor **0** · tail `20260711165308`   |

## 다음

`ew-e22-ui-sports-parity-unlocks` **`[x]` DONE** 2026-07-12 — partial/odds/correct-score live · `sportsParityLive` · next `ew-e23-casino-live-wave`.
