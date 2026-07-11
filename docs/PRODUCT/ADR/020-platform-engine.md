# ADR-020: Platform Engine — KRW Proof · Mission Chains · Co-Bet · Recommendations (E10)

> **상태:** `[x]` Accepted · **날짜:** 2026-07-12  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `ew-e10-platform-engine-wave`  
> **선행:** E9 GATE `ew-e9-gate-identity-support` **`[x]` DONE** 2026-07-12 · Admin `ew-e9-page-admin-support` **`[x]`**  
> **후행:** GATE `ew-e10-gate-platform-world-class` · Admin `ew-e10-page-admin-krw-proof-review` **`[x]` DONE** 2026-07-12 · UI `ew-e10-wallet-settings-ui` · `ew-e10-trust-support-ui` · `ew-e10-growth-ui`  
> **코드 계약:** [`ew-e10-platform-engine-display-contract.ts`](../../../apps/web/src/domain/ew-e10-platform-engine-display-contract.ts)  
> **스펙 정본:** Plan §12.18 · §21.1 E10 · ENGINE_GAP_ADR E10 · §32.2

## Context

§12.18 gap 4건(KRW 증빙 · mission chain unlock · co-bet · ML recommend)은 UI만으로 불가.  
KRW deposit create/match rails는 EXISTS · proof upload/review는 없음.  
Mission catalog(E2)·co-mission(E7)은 존재하나 **server-side chain unlock** · **fixture co-bet** · **recommend RPC**는 없음.  
Track B E10 WAVE = 본 ADR + 동일 PR 엔진 (51차 WAVE merge).

**영구 제외 유지:** 광고 시청 · 설문 미션 (E0).  
**Kakao SDK · `/status` · live chat** = UI todos (`ew-e10-growth-ui` · `ew-e10-trust-support-ui`) — 본 WAVE 범위 밖.

## Decision

### 1. 51차 WAVE bundle (non-waivable · 동일 PR)

| 축 | 판정 | 본 WAVE |
| -- | ---- | ------- |
| KRW deposit proof | **신규** (rails EXISTS 확장) | proof columns · storage · attach/review RPCs |
| Mission chains | **신규** | `mission_chains` · steps · list/status · claim gate |
| Co-bet | **신규** | sessions · link sports bet · reward grant |
| ML recommendations | **신규 (rule-based)** | `rpc_recommend_missions` — real ML **아님** |
| KRW create/match | **EXISTS** | remigration **금지** |
| Co-mission / whale | **EXISTS (E7)** | remigration **금지** |
| Live UI / hubs | **후행 todos** | WAVE: `platformEngine=true` · live flags **false** |

### 2. KRW deposit proof 정본 (non-waivable)

| 항목 | 값 |
| ---- | --- |
| Table | `krw_deposit_requests` + `proof_path` · `proof_status` · review columns |
| Status | `none` · `pending` · `approved` · `rejected` |
| Storage | bucket `krw-deposit-proofs` · path `{user_id}/proof.(jpg\|jpeg\|png\|webp)` |
| User | `rpc_attach_krw_deposit_proof` — own pending deposit only |
| Admin | `rpc_admin_review_krw_deposit_proof` — AAL2 · reason · audit |
| Money | **원장 이동 0** — credit는 기존 match RPC만 |
| Feature kill | `feature_krw_deposit_proof_enabled` |

### 3. Mission chains 정본 (non-waivable)

| 항목 | 값 |
| ---- | --- |
| Tables | `mission_chains` · `mission_chain_steps` |
| Seed | `onboarding_viral`: share_referral_link → invite_friend_signup → viral_streak_share |
| Unlock | step 1 always · step N iff prior viral claim exists |
| Gate | `_assert_mission_chain_claimable` inside `_assert_mission_catalog_claimable` |
| RPCs | `rpc_list_mission_chains` · `rpc_get_mission_chain_status` |
| Money | **원장 이동 0** (unlock) · claim은 기존 viral grant |
| Feature kill | `feature_mission_chains_enabled` |

### 4. Co-bet 정본 (non-waivable)

| 항목 | 값 |
| ---- | --- |
| Pair | affiliate edge only (`_co_mission_partners_linked`) |
| Session | `co_bet_sessions` — pending → active → completed |
| Fixture | `sports_fixtures.id` · link via `sports_bet_legs.fixture_id` |
| Reward | `app_config.co_bet_reward_phon` · reason `co_bet_reward` · **각자** PHON |
| Settlement | sports bet settlement **미변경** — social bonus only |
| RPCs | `rpc_invite_co_bet` · `rpc_accept_co_bet` · `rpc_link_co_bet_bet` · `rpc_complete_co_bet` · `rpc_get_co_bet_status` |
| Feature kill | `feature_co_bet_enabled` |

### 5. Mission recommendations 정본 (optional · non-waivable)

| 항목 | 값 |
| ---- | --- |
| RPC | `rpc_recommend_missions(p_limit)` |
| Scoring | rule-based: unlocked chain step · not claimed · sort_order |
| Exclude | ad/survey via `_mission_catalog_is_forbidden_code` |
| Money | **원장 이동 0** |
| Feature kill | `feature_ml_mission_recommend_enabled` |
| Note | Closed Beta = deterministic rules · external ML model **후속 ADR** |

### 6. UI unlock (WAVE vs 후행)

| 단계 | 내용 |
| ---- | ---- |
| **본 WAVE** | ADR + migration + RPCs + SQL + display contract · `platformEngine=true` |
| **Admin** `ew-e10-page-admin-krw-proof-review` | deposits 증빙 행 | **`[x]` DONE** 2026-07-12 |
| **UI** wallet/trust/growth | live flags flip |
| **GATE** `ew-e10-gate-platform-world-class` | `stack:push-remote` · advisor 0 · Platform World-Class DONE |

## Consequences

- WAVE에서 deposit proof UI · chain hub · co-bet sports UI · recommend carousel live **금지**
- 광고·설문 mission code **금지**
- Proof approve ≠ wallet credit (match-only credit)
- Co-bet does not alter sports odds/settlement Σ
- Remote apply = GATE

## Verification

| Gate | 기대 |
| ---- | ---- |
| SQL | `ew_e10_platform_engine_test.sql` E10-0..E10-5 · CI sql authoritative (G13) |
| Vitest | `ew-e10-platform-engine-display-contract` |
| Remote | GATE: `stack:push-remote` · advisor 0 ERROR |

## Status

Accepted 2026-07-12 — WAVE implement in same PR.
