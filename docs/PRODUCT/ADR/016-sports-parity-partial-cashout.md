# ADR-016: Sports Parity — Partial Cashout · Odds Acceptance · Catalog (E22)

> **상태:** `[x]` Accepted · **날짜:** 2026-07-12  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `ew-e22-sports-parity-wave`  
> **선행:** E21 UI `ew-e21-ui-trade-engine-unlocks` **`[x]` DONE** 2026-07-12  
> **후행:** GATE `ew-e22-gate-sports-parity` **`[x]` DONE** 2026-07-12 → UI `ew-e22-ui-sports-parity-unlocks`  
> **코드 계약:** [`ew-e22-sports-parity-display-contract.ts`](../../../apps/web/src/domain/ew-e22-sports-parity-display-contract.ts)  
> **스펙 정본:** Plan §22.2.5 Tier-B · 52차 EXISTS-RPC rescope

## Context

P10 Sports WORLD는 Tier-A(엔진 exists)를 UI wire로 닫는 구간이다.  
전액 cashout · SGP · system · risk cap은 **이미 RPC가 있어** E22에서 재 migration = FAIL.  
남은 Tier-B는 **부분 cashout** · **배당 수락 정책** · **correct score / sport catalog** · 피드 vendor ADR pin이다.

## Decision

### 1. 52차 rescope (non-waivable)

| 기능 | 판정 | 본 WAVE |
| ---- | ---- | ------- |
| Partial cashout | **신규** | `rpc_preview_sports_partial_cashout` · `rpc_partial_cashout_sports_bet` |
| Odds acceptance | **신규** | `sports_odds_acceptance` + `p_odds_acceptance` on place |
| Correct score | **신규** | registry + settle handler + `score` selection |
| Sport catalog | **신규** | `sports_sport_catalog` + `rpc_list_sports_catalog` |
| Full cashout | **EXISTS** | `rpc_preview_sports_cashout` / `rpc_cashout_sports_bet` — migration **0** · UI = `p10-sports-slip-advanced-wire` **동일 PR** |
| Bet builder (상관배당) | **defer** | SGP=단순 곱 유지 · 상관 엔진은 post-E22 backlog |
| 외부 배당 vendor | **ADR pin** | C1 ingest 구조만 · in-repo feed worker 0 · 유료 vendor = T2 후 |

### 2. Odds acceptance 정본

| 값 | 의미 |
| -- | ---- |
| `strict` (default) | 기존 — latest ≠ client → `odds_changed` |
| `accept_any` | latest로 reprice 후 진행 |
| `accept_better` | latest ≥ client 이면 latest 채택 · 하락이면 `odds_changed` |

Place: `rpc_place_sports_bet(..., p_odds_acceptance TEXT DEFAULT NULL)` — NULL → `app_config.sports_odds_acceptance_default`.

### 3. Partial cashout 정본

| 항목 | 값 |
| ---- | --- |
| Preview | `rpc_preview_sports_partial_cashout(p_bet_id, p_stake_portion)` |
| Execute | `rpc_partial_cashout_sports_bet(p_bet_id, p_stake_portion, p_cashout_amount, p_idempotency_key)` |
| Portion | `0 < portion < stake` — 전액은 EXISTS full RPC만 |
| Offer | `trunc(full_offer * portion / stake, 6)` · exact match |
| Money | unlock/debit portion · credit offer · house delta · **Σ=0** |
| Bet | stake↓ · potential_payout↓ · `status` 유지 `pending` · legs 유지 |

### 4. Market catalog

- `correct_score` — selection=`score` · `line`=`H-A` (예: `2-1`) · settle vs FT goals
- `sports_sport_catalog` — football/basketball/… seed · `rpc_list_sports_catalog`

### 5. Feed vendor (ADR pin only)

0원 출시 = admin/수동 C1 ingest. In-repo feed worker **0**. 유료 vendor 계약은 T2 후 operator 결정.

### 6. UI (동일 PR)

| Surface | Owner |
| ------- | ----- |
| My-bets **전액** cashout card | EXISTS RPC → `p10-sports-slip-advanced-wire` honesty · `LAUNCH_GATES.sportsCashout` |
| Partial / odds policy / correct score UI | GATE/UI todos (`ew-e22-gate` · `ew-e22-ui`) — WAVE는 engine + full cashout wire |

WAVE: `LAUNCH_GATES.sportsParityEngine=true` · partial UI = **live** after `ew-e22-ui-sports-parity-unlocks` (`sportsParityLive=true`).

## Consequences

- Full cashout remigration **FAIL**
- Correlated bet-builder 구현 **FAIL** (본 WAVE)
- Remote apply = GATE (`stack:push-remote` · advisor 0)

## Verification

| Gate | 기대 |
| ---- | ---- |
| SQL | `ew_e22_sports_parity_test.sql` E22-0..E22-4 · CI sql authoritative |
| Vitest | `ew-e22-sports-parity-display-contract` · sports cashout UI |
| Remote | GATE **`[x]`**: `stack:push-remote` · advisor 0 |

## Operator sign-off

Cursor Plan todo `ew-e22-sports-parity-wave` 배정·구현 지시 = 본 ADR Accepted + 동일 PR (신규 Tier-B + 전액 cashout UI wire).
