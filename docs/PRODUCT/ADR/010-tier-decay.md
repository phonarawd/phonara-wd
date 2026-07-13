# ADR-010: Tier Decay (E1 · Closed Beta)

> **상태:** `[x]` Accepted · **날짜:** 2026-07-11  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `ew-e1-decay-wave` (#240)  
> **선행:** [`ENGINE_GAP_ADR.md`](ENGINE_GAP_ADR.md) E0 **`[x]` Accepted**  
> **후행:** `/tier/me` full decay UX (`ew-e1-gate-decay` `[x]`) · `ew-e2-*` (별도)  
> **코드 계약:** [`tier-decay-display-contract.ts`](../../../apps/web/src/domain/tier-decay-display-contract.ts)  
> **스펙 정본:** Plan §17.8

## Context

`user_earn_vip`는 XP 기반 **승급 only**였다. 자동 하락·유지 조건·경고 알림 RPC가 없어 `/tier/me` Decay 패널은 presentation만 가능했고, `tier_keep_status`는 `_repeatable_progress`가 **0 고정**이라 claim 불가였다.

E0 Accepted 후 Track B 첫 migration = 본 ADR + 동일 PR 엔진 구현 (51차 WAVE merge).

## Decision

### 1. 정책 (Closed Beta · non-waivable)

| 항목          | 값                                                                        |
| ------------- | ------------------------------------------------------------------------- |
| 기본 grace    | **45일** (`app_config.tier_decay_grace_days`)                             |
| Diamond grace | **60일** (`tier_decay_grace_days_diamond`)                                |
| 하락 폭       | **최대 1단계 / sweep**                                                    |
| Floor         | `bronze` — 하락 **없음**                                                  |
| Prime Elite   | enum 미존재 → **E4** (본 Wave 범위 밖 · 수동 only)                        |
| 경고          | grace 잔여 **30·15·7·3일** → `notification_outbox` `tier_decay_warning`   |
| 복구          | 유지 조건 충족 시 `last_qualifying_at` 갱신 → grace 리셋 (즉시 하락 방지) |
| XP clamp      | 하락 시 XP를 **새 티어 next-threshold − 1**로 cap (즉시 재승급 방지)      |

### 2. 등급별 유지 조건 (OR · `app_config`)

| 등급     | KRW 입금 합(창) | USDT 거래량 합(창) | 미달 시    |
| -------- | --------------- | ------------------ | ---------- |
| bronze   | —               | —                  | floor      |
| silver   | ≥ 100_000       | ≥ 1_000            | → bronze   |
| gold     | ≥ 500_000       | ≥ 5_000            | → silver   |
| platinum | ≥ 2_000_000     | ≥ 20_000           | → gold     |
| diamond  | ≥ 5_000_000     | ≥ 50_000           | → platinum |

측정 창 = `[now − grace_days, now]`.  
입금 = `krw_deposit_requests.amount_krw` (credited) + `crypto_deposit_requests.amount` USDT (credited, KRW 환산은 crypto를 volume 쪽에만 가산).  
거래량 = `game_bets` + `sports_bets` stake (USDT + PHON→USDT rate) + spot fill notional (있을 때).

### 3. Engine surface

| 객체                                                                         | 역할                                    |
| ---------------------------------------------------------------------------- | --------------------------------------- |
| `user_earn_vip.last_qualifying_at` · `last_decay_at` · `decay_warnings_sent` | grace·경고 상태                         |
| `tier_decay_events`                                                          | append-only 하락 이력                   |
| `_tier_decay_meets_maintenance`                                              | 유지 조건 판정                          |
| `_tier_decay_apply_one`                                                      | 1-tier drop + XP clamp + event + outbox |
| `rpc_run_tier_decay`                                                         | cron/service sweep (경고 + 하락)        |
| `rpc_get_tier_decay_status`                                                  | authenticated read (`/tier/me`)         |
| `_repeatable_progress(tier_keep_status)`                                     | 유지 충족 시 progress=1                 |
| pg_cron `phonara_tier_decay_daily`                                           | 매일 03:15 UTC                          |

### 4. Money / security

- Tier 변경은 **원장 머니 이동 없음** (VIP 메타만) — Σ=0 영향 0
- `tier_keep_status` claim은 기존 `mission_reward` PHON credit 경로 (conservation 기존 테스트)
- Internal helpers: `REVOKE` from `anon`/`authenticated`
- `rpc_run_tier_decay`: `service_role` + admin only (cron)
- `rpc_get_tier_decay_status`: `authenticated` · `auth.uid()` own row

### 5. UI unlock (동일 Wave)

- `isTierKeepStatusClaimEngineLive() = true`
- `LAUNCH_GATES.tierDecayEngine = true`
- Dead-control `tier-keep-status-claim-blocked` → `mitigatedBy: live`

## Consequences

- `/tier/me` countdown·경고는 `rpc_get_tier_decay_status` 정본 (client 하락 시뮬 **금지**)
- E4 Prime Elite / fee caps는 별도 Wave
- Remote: `test:sql` → `stack:push-remote` → advisor 0

## Verification

| Gate   | 기대                                                                           |
| ------ | ------------------------------------------------------------------------------ |
| SQL    | `ew_e1_tier_decay_test.sql` — floor · 1-tier · grace · warning · keep progress |
| Grants | `rpc_run_tier_decay` auth deny · service grant                                 |
| Vitest | `tier-decay-display-contract` · dead-controls live · tier-me claim path        |
| Remote | `stack:push-remote` · advisor 0 ERROR                                          |

## Operator sign-off

Cursor Plan todo `ew-e1-decay-wave` 배정·구현 지시 = 본 ADR Accepted + 동일 PR 엔진.
