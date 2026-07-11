# ENGINE_GAP E4 Tier Option B GATE (#247)

> **상태:** `[x]` DONE · **날짜:** 2026-07-11  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `ew-e4-gate-tier-option-b` (#247)  
> **선행:** `ew-e4-tier-option-b-wave` (#246) `[x]`  
> **후행:** `ew-e5-gap-surfaces-wire` (#248)  
> **코드 계약:** [`ew-e4-gate-tier-option-b-display-contract.ts`](../../apps/web/src/domain/ew-e4-gate-tier-option-b-display-contract.ts)

## 범위

| 항목 | 내용 |
| ---- | ---- |
| SQL | `ew_e4_tier_option_b_test.sql` E4-0..E4-4 · tier meta/caps only (Σ=0 영향 0) · **CI sql authoritative** (G13) |
| Remote | `stack:push-remote` · migration names `ew_e4_prime_elite_enum` + `ew_e4_tier_option_b` |
| Advisor | security advisor **0 ERROR** |
| Unlock | fee % display truth · admin tier write · `/sports/vip` · `/tier/elite` prep |

## Unlock 상세

| Surface | Launch gate | 비고 |
| ------- | ----------- | ---- |
| `/fees` · trade fee badge % | `tierFeeDisplayTruth` | Option B discount % truth |
| `/admin/tiers` · `/users/$id/tier` | `adminTierWrite` | `rpc_admin_set_user_earn_vip_tier` write UI |
| `/sports/vip` | `sportsVipSurface` | engine exists · live markets browse = E5 |
| `/tier/elite` | `tierEliteSurface` | Prime Elite surface prep · live wire = E5 |

## 증거

| Gate | 결과 |
| ---- | ---- |
| vitest E4 GATE + unlock contracts | **22/22** |
| typecheck | green |
| check:i18n | green |
| Remote migration | `ew_e4_prime_elite_enum` + `ew_e4_tier_option_b` (tail `20260711143656`) |
| Advisor | **0 ERROR** (`stack:push-remote`) |
| Unlock | `isTierOptionBSurfacesFullyUnlocked() = true` |
| SQL | `ew_e4_tier_option_b_test.sql` E4-0..E4-4 · **CI sql authoritative** (G13 · local heavy deny) |

## 다음

`ew-e5-gap-surfaces-wire` — STUB→live presentation wire for gap surfaces (VIP markets · elite · leaderboard rank list) · **`[x]` DONE** 2026-07-11 · GATE `ew-e5-gate-gap-surfaces` **`[x]` DONE** · 후행 `ew-e6-admin-desks-wave`.
