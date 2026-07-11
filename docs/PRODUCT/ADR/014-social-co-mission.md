# ADR-014: Social Co-Mission + Whale Threshold (E7 · Closed Beta)

> **상태:** `[x]` Accepted · **날짜:** 2026-07-12  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `ew-e7-social-wave` (#252)  
> **선행:** [`ENGINE_GAP_ADR.md`](ENGINE_GAP_ADR.md) E0 **`[x]`** · E6 GATE `ew-e6-gate-admin-desks` **`[x]`**  
> **후행:** GATE `ew-e7-gate-engine-wave` (#253) **`[x]` DONE** 2026-07-12 — remote apply · social missions UI unlock · E21 WAVE `#254` **`[x]`** · 다음 `ew-e21-gate-trade-engine-parity`  
> **코드 계약:** [`social-co-mission-display-contract.ts`](../../../apps/web/src/domain/social-co-mission-display-contract.ts)  
> **스펙 정본:** Plan §12.18 · §13.7 · §13.10.7 E7 · §21.1 E7

## Context

「친구와 함께 미션」(co-complete)과 「고액 입금 100만+」(whale)는 Plan gap으로 E7에만 배치되어 있었고,  
E2 `mission_catalog` / viral claim만으로는 **두 유저 sync** · **입금 threshold grant**가 없었다.

E0 Accepted · E6 GATE 후 Track B E7 = 본 ADR + 동일 PR 엔진 (51차 WAVE merge).

## Decision

### 1. Co-mission 정본 (non-waivable)

| 항목        | 값                                                                      |
| ----------- | ----------------------------------------------------------------------- |
| Enum        | `co_mission_code` — Closed Beta seed: `co_share_referral`               |
| Pair        | affiliate edge만 (`affiliate_relationships` parent↔child 양방향)        |
| Session     | `co_mission_sessions` — pending → active → completed                    |
| Window      | UTC `day:YYYY-MM-DD` (viral share와 동일 day bucket)                    |
| Eligibility | 양쪽 모두 해당 day에 `viral_mission_claims.share_referral_link` 존재    |
| Reward      | `app_config.co_share_referral_reward_phon` — **각자** PHON (ledger Σ=0) |
| Reason      | `co_mission_reward` ∈ `_is_reward_issuance_reason`                      |
| 영구 제외   | **광고·설문** · co-bet(E10) · mission chain(E10)                        |

**RPCs**

| RPC                         | 역할                                           |
| --------------------------- | ---------------------------------------------- |
| `rpc_invite_co_mission`     | initiator → partner invite (pending)           |
| `rpc_accept_co_mission`     | partner accept → active                        |
| `rpc_complete_co_mission`   | 본인 ready · 양쪽 ready+eligible 시 양쪽 grant |
| `rpc_get_co_mission_status` | 본인 세션 목록                                 |

### 2. Whale mission 정본 (non-waivable)

| 항목        | 값                                                                        |
| ----------- | ------------------------------------------------------------------------- |
| Enum        | `whale_mission_code` — Closed Beta: `whale_deposit_1m`                    |
| Threshold   | `app_config.whale_deposit_1m_threshold_phon` = `1000000.000000`           |
| Deposit 합  | lifetime `wallet_ledger` PHON credit · `reason_code = krw_deposit_credit` |
| Crypto USDT | Closed Beta **제외** (USDT≠PHON · 별도 ADR)                               |
| Claim       | one-shot · `whale_mission_claims` UNIQUE (user_id, mission)               |
| Reward      | `app_config.whale_deposit_1m_reward_phon`                                 |
| Reason      | `whale_mission_reward` ∈ `_is_reward_issuance_reason`                     |

**RPCs:** `rpc_claim_whale_mission` · `rpc_get_whale_mission_status`

### 3. Money / security

- Grant는 `_credit_wallet_internal` + reward mint (`reward_issuance_phon`) → **Σ=0**
- Idempotency: co = `co:{session}:{user}` · whale = `whale:{user}:{mission}`
- Client RPCs: `auth.uid()` · `_assert_system_live` · activity · consent · rate limit
- Tables: own SELECT RLS · INSERT via SECURITY DEFINER only · `REVOKE` helpers from anon/authenticated
- Admin write UI **없음** (config = `app_config` · GATE 후 노출만)

### 4. UI unlock (WAVE vs GATE)

| 단계                              | 내용                                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| **본 WAVE**                       | ADR + migration + RPCs + SQL test + display contract · `LAUNCH_GATES.socialCoMissionEngine=true` |
| **GATE** `ew-e7-gate-engine-wave` | `test:sql` · `stack:push-remote` · advisor 0 · **social missions UI** unlock                     |

## Consequences

- `/home/missions` social lane은 GATE 후 live wire (본 WAVE UI embed **금지**)
- Whale threshold는 KRW→PHON credit만 — USDT crypto 합산은 후속 Wave
- Remote: WAVE 후 GATE에서 `test:sql` → `stack:push-remote` → advisor 0

## Verification

| Gate   | 기대                                                                                                          |
| ------ | ------------------------------------------------------------------------------------------------------------- |
| SQL    | `ew_e7_social_co_mission_test.sql` — invite/accept/complete · affiliate deny · whale threshold · conservation |
| Grants | anon deny · authenticated EXECUTE on client RPCs only                                                         |
| Vitest | `social-co-mission-display-contract`                                                                          |
| Remote | GATE: `stack:push-remote` · advisor 0 ERROR                                                                   |

## Operator sign-off

Cursor Plan todo `ew-e7-social-wave` 배정·구현 지시 = 본 ADR Accepted + 동일 PR 엔진.
