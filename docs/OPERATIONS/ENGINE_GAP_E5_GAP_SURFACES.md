# ENGINE_GAP E5 Gap Surfaces WIRE (#248)

> **상태:** `[x]` DONE · **날짜:** 2026-07-11  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `ew-e5-gap-surfaces-wire` (#248)  
> **선행:** `ew-e4-gate-tier-option-b` (#247) `[x]`  
> **후행:** `ew-e5-gate-gap-surfaces` (#249)  
> **코드 계약:** [`ew-e5-gap-surfaces-display-contract.ts`](../../apps/web/src/domain/ew-e5-gap-surfaces-display-contract.ts)

## 범위

| 항목          | 내용                                                                                                 |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| Engine        | **0** — E1/E3/E4 migrations already remote · no new SQL                                              |
| Wire          | `/tier/me` decay (E1 live verify) · `/referral/leaderboard` rank list · `/sports/vip` fixture browse |
| Dead-controls | `referral-leaderboard-stub` · `sports-vip-coming-soon` → `mitigatedBy: live`                         |

## Unlock 상세

| Surface                 | 동작                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `/tier/me`              | E1 `rpc_get_tier_decay_status` · countdown · keep claim already live — E5 asserts wire                                   |
| `/referral/leaderboard` | `rpc_get_affiliate_rank_leaderboard` · window tabs · rank/name/qualified_count · **no money columns**                    |
| `/sports/vip`           | Platinum+ eligibility via `rpc_get_user_tier_summary` · shared `SportsFixtureBoard` (dedicated VIP markets RPC **없음**) |

## 증거

| Gate                               | 결과           |
| ---------------------------------- | -------------- |
| vitest E5 WIRE + surface contracts | (gate:ai-impl) |
| typecheck                          | green          |
| check:i18n                         | green          |
| Migration                          | **none**       |

## 다음

`ew-e5-gate-gap-surfaces` (#249) — GATE closeout **`[x]` DONE** 2026-07-11 · 후행 `ew-e6-admin-desks-wave`.
