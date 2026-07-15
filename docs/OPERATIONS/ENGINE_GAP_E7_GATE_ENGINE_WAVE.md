# ENGINE_GAP E7 Social GATE (#253)

> **상태:** `[x]` DONE · **날짜:** 2026-07-12  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `ew-e7-gate-engine-wave` (#253)  
> **선행:** `ew-e7-social-wave` (#252) `[x]`  
> **후행:** `ew-e21-trade-parity-wave`  
> **코드 계약:** [`ew-e7-gate-engine-wave-display-contract.ts`](../../apps/web/src/domain/ew-e7-gate-engine-wave-display-contract.ts)

## 범위

| 항목        | 내용                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| SQL         | `ew_e7_social_co_mission_test.sql` E7-0..E7-4 · co/whale conservation · **CI sql authoritative** (G13) |
| Remote      | `stack:push-remote` · migration name `ew_e7_social_co_mission`                                         |
| Advisor     | security advisor **0 ERROR**                                                                           |
| Engine unit | `test:engine` green                                                                                    |
| Unlock      | `/home/missions?tab=social` — `socialMissionsLive` · co-mission · whale_deposit_1m                     |

## Unlock 상세

| Surface                     | Launch gate             | 비고                                              |
| --------------------------- | ----------------------- | ------------------------------------------------- |
| `/home/missions` social tab | `socialMissionsLive`    | co-mission + whale engine path unlocked · ADR-014 |
| Co RPCs                     | `socialCoMissionEngine` | invite · accept · complete · status               |
| Whale RPCs                  | same                    | claim · status · KRW→PHON threshold               |

## 증거

| Gate                            | 결과                                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------------------- |
| vitest E7 GATE + WAVE contracts | **5/5**                                                                                           |
| `test:engine`                   | **285/285**                                                                                       |
| typecheck · i18n · release      | green                                                                                             |
| Remote migration                | `ew_e7_social_co_mission` (tail `20260711154815`)                                                 |
| Advisor                         | **0 ERROR** (`stack:push-remote`)                                                                 |
| Unlock                          | `isSocialMissionsFullyUnlocked() = true`                                                          |
| SQL                             | `ew_e7_social_co_mission_test.sql` E7-0..E7-4 · **CI sql authoritative** (G13 · local heavy deny) |

## 다음

`ew-e21-ui-trade-engine-unlocks` — E21 GATE `#255` **`[x]` DONE** 2026-07-12 · WAVE `#254` **`[x]`** — hedge/reduce-only UI · `tradeParityLive`.
