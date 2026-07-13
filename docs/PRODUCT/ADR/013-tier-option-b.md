# ADR-013: Tier Option B — Unified Caps + Prime Elite (E4 · Closed Beta)

> **상태:** `[x]` Accepted · **날짜:** 2026-07-11  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `ew-e4-tier-option-b-wave` (#246)  
> **선행:** [`ENGINE_GAP_ADR.md`](ENGINE_GAP_ADR.md) E0 **`[x]`** · E3 GATE `ew-e3-gate-cms-promotions` **`[x]`**  
> **후행:** GATE `ew-e4-gate-tier-option-b` **`[x]`** · UI unlock E5 (`/sports/vip` · `/tier/elite` · fee % display)  
> **코드 계약:** [`tier-option-b-display-contract.ts`](../../../apps/web/src/domain/tier-option-b-display-contract.ts)  
> **스펙 정본:** Plan §17.3 · §17.6 · §21.1 E4 · §31.3

## Context

Option A는 `rpc_get_earn_hub_status`로 Earn limits만 엔진 강제했고, Trade/Sports/Casino fee·stake·출금 한도는 **표시 전용**이었다.  
`earn_vip_tier`에 **Prime Elite**가 없어 초대제·수동 승급이 불가능했고, Admin `/tiers`·`/users/$id/tier`는 **read-only**였다.

E0 Accepted · E3 GATE 후 Track B E4 = 본 ADR + 동일 PR 엔진 (51차 WAVE merge).

## Decision

### 1. Option B 정본 (non-waivable)

| 항목           | 값                                                                                    |
| -------------- | ------------------------------------------------------------------------------------- |
| RPC            | `rpc_get_user_tier_summary` — tier · xp · fee discount · leverage/stake/withdraw caps |
| Earn limits    | 기존 `_earn_limit_*` 유지 · summary에 포함                                            |
| Trade fee      | `_earn_vip_fee_rate(user, base)` — `(1 − discount)` × market rate                     |
| Trade leverage | `_earn_vip_trade_leverage_cap(tier)` — `LEAST(market_max, tier_cap)`                  |
| Sports stake   | `_assert_sports_stake_limits`에 Earn VIP 배수                                         |
| Casino stake   | `_assert_game_stake_limits`에 Earn VIP 배수                                           |
| Withdrawal     | `_earn_vip_withdrawal_daily_cap(user)` — tier별 일일 한도 (NULL = unlimited)          |
| Money          | fee 할인 = 원장 debit/credit 동일 금액 적용 → **Σ=0 유지**                            |

### 2. Fee / cap 매트릭스 (Closed Beta)

| 등급            | fee discount | leverage max | casino/sports stake mult | withdraw daily (PHON text) |
| --------------- | ------------ | ------------ | ------------------------ | -------------------------- |
| bronze          | 0%           | 5            | 1.0                      | `100000.000000`            |
| silver          | 10%          | 10           | 1.25                     | `500000.000000`            |
| gold            | 15%          | 20           | 1.5                      | `2000000.000000`           |
| platinum        | 25%          | 50           | 2.0                      | `10000000.000000`          |
| diamond         | 35%          | 75           | 3.0                      | NULL (unlimited)           |
| **prime_elite** | 50%          | 100          | 5.0                      | NULL (unlimited)           |

`app_config` 키로 운영 튜닝 가능 (`tier_fee_discount_bps_*` · `tier_leverage_cap_*` · `tier_stake_mult_*` · `tier_withdraw_daily_phon_*`).

### 3. Prime Elite (enum + 수동 only)

| 규칙         | 값                                                       |
| ------------ | -------------------------------------------------------- |
| Enum         | `earn_vip_tier` += `prime_elite`                         |
| XP 자동 승급 | **금지** — `_golden_earth_tier_for_xp` max = diamond     |
| XP 경로 강등 | **금지** — BEFORE UPDATE trigger preserves `prime_elite` |
| Decay        | **수동 only** — `_tier_decay_apply_one` skip             |
| 부여         | `rpc_admin_set_user_earn_vip_tier` only (invite)         |
| 하락         | Admin write → diamond (또는 하위) + reason               |

### 4. Admin tier write

| 객체                               | 역할                                                            |
| ---------------------------------- | --------------------------------------------------------------- |
| `tier_admin_events`                | append-only 수동 승급/강등 이력                                 |
| `rpc_admin_set_user_earn_vip_tier` | admin AAL2 · reason ≥4 · audit · session allow flag for trigger |
| Admin hook                         | WAVE: write path ready · UI unlock = GATE                       |

### 5. Money / security

- Tier 메타·cap 변경은 **원장 이동 없음** (fee 할인 적용 시에만 fee leg 금액 축소 · 보존 유지)
- Admin RPC: `_is_admin()` + `_assert_admin_aal2()`
- Summary RPC: `authenticated` · `auth.uid()` own row
- Internal helpers: `REVOKE` from `anon`/`authenticated`

### 6. UI unlock (WAVE vs GATE vs E5)

| 단계                                | 내용                                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------ |
| **본 WAVE**                         | ADR + migration + summary RPC + Prime Elite + caps enforcement + admin write RPC + hook    |
| **GATE** `ew-e4-gate-tier-option-b` | **`[x]`** `test:sql` · `stack:push-remote` · advisor 0 · fee % / VIP surfaces launch gates |
| **E5**                              | `/sports/vip` · `/tier/elite` live wire                                                    |

WAVE: `LAUNCH_GATES.tierOptionBEngine = true` · fee display truth / elite route = GATE·E5.

## Consequences

- `/tier/me` · fees · trade badge는 summary RPC로 fee/cap **truth** 표시 가능 (GATE 후 %)
- Prime Elite는 Admin 초대만 · 자동 XP/Decay 경로 없음
- Remote: WAVE 후 GATE에서 `test:sql` → `stack:push-remote` → advisor 0

## Verification

| Gate   | 기대                                                                                               |
| ------ | -------------------------------------------------------------------------------------------------- |
| SQL    | `ew_e4_tier_option_b_test.sql` — enum · summary · admin write · prime preserve · caps · decay skip |
| Grants | summary anon deny · admin write authz                                                              |
| Vitest | `tier-option-b-display-contract` · unified tier order · admin hook                                 |
| Remote | GATE: `stack:push-remote` · advisor 0 · `ew_e4_prime_elite_enum` + `ew_e4_tier_option_b` applied   |

## Operator sign-off

Cursor Plan todo `ew-e4-tier-option-b-wave` 배정·구현 지시 = 본 ADR Accepted + 동일 PR 엔진.
