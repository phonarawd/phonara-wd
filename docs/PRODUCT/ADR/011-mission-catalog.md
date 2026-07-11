# ADR-011: Mission Catalog Admin CRUD (E2 · Closed Beta)

> **상태:** `[x]` Accepted · **날짜:** 2026-07-11  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `ew-e2-missions-wave` (#242)  
> **선행:** [`ENGINE_GAP_ADR.md`](ENGINE_GAP_ADR.md) E0 **`[x]`** · E1 GATE `ew-e1-gate-decay` **`[x]`**  
> **후행:** `/admin/earn/missions` write UI unlock (`ew-e2-gate-missions`) **`[x]`**  
> **코드 계약:** [`mission-catalog-display-contract.ts`](../../../apps/web/src/domain/mission-catalog-display-contract.ts)  
> **스펙 정본:** Plan §12.18 · §13.10.7 E2 · §22.5.1

## Context

P2 Admin missions desk는 `app_config` **read-only** 매트릭스였다 (`useAdminMissionsDesk` · authenticated SELECT only).  
보상·쿼터·노출을 바꾸려면 migration이 필요했고, 광고·설문 미션을 catalog에 넣는 경로도 열려 있었다.

E0 Accepted 후 Track B E2 = 본 ADR + 동일 PR 엔진 (51차 WAVE merge).

## Decision

### 1. Catalog 정본 (non-waivable)

| 항목      | 값                                                                                          |
| --------- | ------------------------------------------------------------------------------------------- |
| 테이블    | `mission_catalog` — viral + earn_limit 행만                                                 |
| 보상/쿼터 | 기존 `app_config` 키에 **동기화 write** (claim 경로 불변)                                   |
| 노출      | `exposure` ∈ `{live, hidden}` · catalog 정본                                                |
| 활성      | `enabled` boolean · false면 claim 거부                                                      |
| CRUD      | Create=allowlist seed만 · Read=list RPC · Update=upsert RPC · Delete=soft (`enabled=false`) |
| 영구 제외 | **광고·설문** catalog_key/mission_code **거부** (E0 RED STOP)                               |

### 2. Allowlist (Closed Beta)

**Viral** (`family=viral` · `viral_mission_code`):

| catalog_key                    | reward key                              | quota key         | extra                         |
| ------------------------------ | --------------------------------------- | ----------------- | ----------------------------- |
| `viral:share_referral_link`    | `viral_share_referral_link_reward_phon` | `…_max_per_day`   | —                             |
| `viral:share_story_template`   | …                                       | `…_max_per_week`  | —                             |
| `viral:invite_friend_signup`   | …                                       | `…_max_per_day`   | —                             |
| `viral:affiliate_content_post` | …                                       | `…_max_per_month` | —                             |
| `viral:viral_streak_share`     | …                                       | `…_max_per_day`   | `viral_streak_share_min_days` |

**Earn limits** (`family=earn_limit`):

`referral_qualified_reward_phon` · `referral_pending_reward_phon` · `referral_velocity_max_24h` · `earn_phon_to_usdt_rate` · `earn_season_global_xp` · `launch_slots_total`

신규 엔진 미션 enum 추가는 **본 Wave 범위 밖** (별도 migration).

### 3. Engine surface

| 객체                                                       | 역할                                  |
| ---------------------------------------------------------- | ------------------------------------- |
| `mission_catalog`                                          | 메타 · exposure · enabled · sort      |
| `rpc_admin_list_mission_catalog`                           | admin AAL2 list (+ app_config values) |
| `rpc_admin_upsert_mission_catalog`                         | admin AAL2 update + reason + audit    |
| `_assert_mission_catalog_claimable`                        | viral claim 전 exposure/enabled 검사  |
| `rpc_claim_viral_mission` / `rpc_get_viral_mission_status` | hidden/disabled 반영                  |

### 4. Money / security

- Catalog write는 **원장 머니 이동 없음** — `app_config` 튜닝만 (향후 claim에 반영)
- PHON/quota 값은 **text numeric** 검증 · JS `number` 금지
- `p_reason` ≥ 4자 필수 · `audit_logs` `mission_catalog_upsert`
- Internal helpers: `REVOKE` from `anon`/`authenticated`
- Admin RPCs: `_is_admin()` + `_assert_admin_aal2()`
- Table: admin SELECT via RLS · authenticated SELECT 0 (RPC only)

### 5. UI unlock (WAVE vs GATE)

| 단계                           | 내용                                                                         |
| ------------------------------ | ---------------------------------------------------------------------------- |
| **본 WAVE**                    | ADR + migration + list/upsert RPC + admin hook write path                    |
| **GATE** `ew-e2-gate-missions` | `test:sql` · `stack:push-remote` · advisor 0 · **write UI** unlock **`[x]`** |

## Consequences

- `/admin/earn/missions` read는 list RPC로 전환 (app_config 직접 SELECT 병행 가능 · 정본=RPC)
- hidden viral 미션은 유저 status/claim에서 제외·거부
- E3 CMS/promotions · E7 co-mission은 별도 Wave
- Remote: WAVE 후 GATE에서 `test:sql` → `stack:push-remote` → advisor 0

## Verification

| Gate   | 기대                                                                                        |
| ------ | ------------------------------------------------------------------------------------------- |
| SQL    | `ew_e2_mission_catalog_test.sql` — list · upsert · deny ad/survey · claim block when hidden |
| Grants | admin RPC auth deny · authenticated grant                                                   |
| Vitest | `mission-catalog-display-contract` · admin missions desk wire                               |
| Remote | GATE: `stack:push-remote` · advisor 0 ERROR                                                 |

## Operator sign-off

Cursor Plan todo `ew-e2-missions-wave` 배정·구현 지시 = 본 ADR Accepted + 동일 PR 엔진.
