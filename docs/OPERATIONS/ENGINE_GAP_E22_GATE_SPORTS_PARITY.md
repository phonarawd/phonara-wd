# ENGINE_GAP E22 Sports Parity GATE

> **상태:** `[x]` DONE · **날짜:** 2026-07-12  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `ew-e22-gate-sports-parity`  
> **선행:** `ew-e22-sports-parity-wave` `[x]`  
> **후행:** `ew-e22-ui-sports-parity-unlocks`  
> **코드 계약:** [`ew-e22-gate-sports-parity-display-contract.ts`](../../apps/web/src/domain/ew-e22-gate-sports-parity-display-contract.ts)

## 범위

| 항목       | 내용                                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| SQL        | `ew_e22_sports_parity_test.sql` E22-0..E22-4 · partial cashout · **Σ=0** · odds · correct_score · catalog · **CI sql authoritative** (G13) |
| Remote     | `stack:push-remote` · migration name `ew_e22_sports_parity`                                                                                |
| Advisor    | security advisor **0 ERROR**                                                                                                               |
| EXISTS pin | 전액 cashout — remigration **0**                                                                                                           |
| Tier-B UI  | `sportsParityLive=false` · partial/odds/correct-score **built_hidden** until UI todo                                                       |

## Unlock / honesty 상세

| Surface              | 상태                         | 비고                                                            |
| -------------------- | ---------------------------- | --------------------------------------------------------------- |
| My-bets 전액 cashout | **live** (EXISTS RPC · WAVE) | `rpc_preview_sports_cashout` · `rpc_cashout_sports_bet`         |
| Partial cashout 제어 | **built_hidden**             | UI todo · `rpc_partial_cashout_sports_bet` · `sportsParityLive` |
| Odds acceptance 선택 | **built_hidden**             | UI todo · `p_odds_acceptance`                                   |
| Correct score 마켓   | **built_hidden**             | UI todo · registry `correct_score`                              |

## 증거

| Gate                             | 결과                                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------------------ |
| vitest E22 GATE + WAVE contracts | **3/3**                                                                                          |
| typecheck · i18n · release       | green                                                                                            |
| Remote migration                 | `ew_e22_sports_parity` (tail `20260711165308_ew_e22_sports_parity`)                              |
| Advisor                          | **0 ERROR** (`stack:push-remote`)                                                                |
| Partial unlock path              | `isPartialCashoutUiPathUnlocked() = true`                                                        |
| Odds unlock path                 | `isOddsAcceptanceUiPathUnlocked() = true`                                                        |
| Correct score unlock path        | `isCorrectScoreUiPathUnlocked() = true`                                                          |
| GATE ready                       | `isEwE22SportsParityGateReady() = true` · `sportsParityLive=false`                               |
| SQL                              | `ew_e22_sports_parity_test.sql` E22-0..E22-4 · **CI sql authoritative** (G13 · local heavy deny) |

## 다음

`ew-e22-ui-sports-parity-unlocks` **`[x]` DONE** 2026-07-12 — 부분 cashout · odds 수락 · correct score · `sportsParityLive=true` · next `ew-e23-casino-live-wave`.
