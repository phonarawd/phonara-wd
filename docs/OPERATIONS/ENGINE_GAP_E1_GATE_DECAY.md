# ENGINE_GAP E1 Decay GATE (#241)

> **상태:** `[x]` DONE · **날짜:** 2026-07-11  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `ew-e1-gate-decay` (#241)  
> **선행:** `ew-e1-decay-wave` (#240) `[x]`  
> **후행:** `ew-e2-missions-wave` (#242)  
> **코드 계약:** [`ew-e1-gate-decay-display-contract.ts`](../../apps/web/src/domain/ew-e1-gate-decay-display-contract.ts)

## 범위

| 항목    | 내용                                                                                                          |
| ------- | ------------------------------------------------------------------------------------------------------------- |
| SQL     | `ew_e1_tier_decay_test.sql` E1-0..E1-4 · VIP 메타만 (Σ=0 영향 0) · **CI sql authoritative** (G13)             |
| Remote  | `stack:push-remote` · migration name `ew_e1_tier_decay` already applied                                       |
| Advisor | security advisor **0 ERROR**                                                                                  |
| Unlock  | `/tier/me` full — `rpc_get_tier_decay_status` · countdown · maintenance · `tierDecayEngine` · keep claim live |

## 증거

| Gate                                       | 결과                                       |
| ------------------------------------------ | ------------------------------------------ |
| vitest E1 GATE + tier-me + settings unlock | **32/32**                                  |
| typecheck                                  | green                                      |
| check:i18n                                 | green                                      |
| Remote migration                           | `ew_e1_tier_decay` (tail `20260711132456`) |
| Advisor                                    | **0 ERROR** (`stack:push-remote`)          |
| Unlock                                     | `isTierMeDecayFullUnlocked() = true`       |

## 다음

`ew-e2-gate-missions` **`[x]` DONE** — 후행 `ew-e3-viral-cms-wave`.
