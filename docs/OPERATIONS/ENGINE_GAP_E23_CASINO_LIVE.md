# ENGINE_GAP E23 Casino Live

> **상태:** `[x]` DONE · **날짜:** 2026-07-12  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `ew-e23-casino-live-wave`  
> **ADR:** [`017-casino-live-progressive-pf.md`](../PRODUCT/ADR/017-casino-live-progressive-pf.md)  
> **코드 계약:** [`ew-e23-casino-live-display-contract.ts`](../../apps/web/src/domain/ew-e23-casino-live-display-contract.ts)  
> **선행:** E22 UI `ew-e22-ui-sports-parity-unlocks` `[x]`  
> **후행:** `ew-e23-gate-casino-live` → `ew-e23-ui-casino-live-unlocks`

## 범위 (51차 WAVE · 동일 PR)

| 항목      | 내용                                                                                            |
| --------- | ----------------------------------------------------------------------------------------------- |
| ADR       | progressive · live crash · PF seed · one-shot preserve · server autobet **0**                   |
| Migration | `20260810000001_ew_e23_casino_live.sql` (**신규만**)                                            |
| NEW RPCs  | PF get/set/rotate · progressive start/step/cashout/sweep · live crash get/place/cashout/advance |
| EXISTS    | `rpc_place_game_bet` one-shot (`p_use_account_pf=false` · nonce=1)                              |
| Launch    | `LAUNCH_GATES.casinoLiveEngine=true` · `casinoLiveLive=false`                                   |
| Defer     | live UI · fairness seed controls UI · server autobet                                            |

## 증거

| Gate                              | 결과                                                                                                                       |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `gate:ai-impl` ew-e23-casino-live | vitest display-contract · typecheck · i18n · release                                                                       |
| SQL                               | `ew_e23_casino_live_test.sql` E23-0..E23-4 · **CI sql authoritative** (G13)                                                |
| Remote                            | GATE: `stack:push-remote` · advisor **0** — see [`ENGINE_GAP_E23_GATE_CASINO_LIVE.md`](ENGINE_GAP_E23_GATE_CASINO_LIVE.md) |

## 다음

`ew-e23-ui-casino-live-unlocks` — GATE **`[x]` DONE** 2026-07-12 (`stack:push-remote` · advisor 0 · casino_parity E23 GROWTH).
