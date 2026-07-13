# ENGINE_GAP E22 Sports UI Unlock (`ew-e22-ui-sports-parity-unlocks`)

> **상태:** `[x]` DONE · **날짜:** 2026-07-12  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `ew-e22-ui-sports-parity-unlocks`  
> **선행:** E22 GATE `ew-e22-gate-sports-parity` **`[x]`** · WAVE **`[x]`**  
> **후행:** `ew-e23-casino-live-wave`  
> **코드 계약:** [`ew-e22-ui-sports-parity-unlocks-display-contract.ts`](../../apps/web/src/domain/ew-e22-ui-sports-parity-unlocks-display-contract.ts)

## 범위

| 항목            | 내용                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------ |
| Launch          | `LAUNCH_GATES.sportsParityLive=true`                                                             |
| Partial cashout | My-bets 헤더 25/50/75% · `rpc_preview_sports_partial_cashout` / `rpc_partial_cashout_sports_bet` |
| Odds policy     | Slip `accept_better` 기본 · `strict` / `accept_any` / `accept_better` · `p_odds_acceptance`      |
| Correct score   | board selectable · `sports.market.correct_score`                                                 |
| Migration       | **0** (engine WAVE/GATE만)                                                                       |

## Unlock 표

| Surface                  | 상태     | 비고                            |
| ------------------------ | -------- | ------------------------------- |
| Partial cashout header   | **live** | `sports-partial-cashout-header` |
| Odds acceptance selector | **live** | decline = `accept_better` 거절  |
| Correct score market     | **live** | fixture markets board           |
| Full cashout card        | **live** | EXISTS honesty pin              |

## 증거

| Gate                              | 결과                                     |
| --------------------------------- | ---------------------------------------- |
| `gate:ai-impl` sports UI unlock   | vitest + typecheck + i18n + release      |
| `isEwE22SportsUiParityUnlocked()` | **true**                                 |
| Remote migration                  | GATE already applied — remigration **0** |

## 다음

`ew-e23-casino-live-wave` **`[x]` DONE** 2026-07-12 · GATE `ew-e23-gate-casino-live` **`[x]` DONE** 2026-07-12 — next `ew-e23-ui-casino-live-unlocks`.
