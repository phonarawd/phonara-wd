# ADR-012: Viral Leaderboard + CMS/Promotions (E3 · Closed Beta)

> **상태:** `[x]` Accepted · **날짜:** 2026-07-11  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `ew-e3-viral-cms-wave` (#244)  
> **선행:** [`ENGINE_GAP_ADR.md`](ENGINE_GAP_ADR.md) E0 **`[x]`** · E2 GATE `ew-e2-gate-missions` **`[x]`**  
> **후행:** live wire (`ew-e5-gap-surfaces-wire`) · GATE `ew-e3-gate-cms-promotions` **`[x]`** 2026-07-11  
> **코드 계약:** [`viral-cms-display-contract.ts`](../../../apps/web/src/domain/viral-cms-display-contract.ts)  
> **스펙 정본:** Plan §12.18 · §21.1 E3 · §22.5.1

## Context

`/referral/leaderboard`는 presentation stub였다 — `affiliate_rank_leaderboard` 엔진/RPC가 없어 가짜 랭킹을 쓸 수 없었다.  
`cms_content`는 기본 CRUD(`rpc_admin_list/upsert_cms_content` · `starts_at`/`ends_at`)만 있었고, **타게팅(등급·audience) · 스케줄 퍼블리시 cron**이 없어 `/admin/promotions` full desk가 막혀 있었다.  
Admin `/viral-stats`는 테이블 샘플 스캔(부분 집계)만 가능했다.

E0 Accepted · E2 GATE 후 Track B E3 = 본 ADR + 동일 PR 엔진 (51차 WAVE merge).

## Decision

### 1. Affiliate rank leaderboard (non-waivable)

| 항목      | 값                                                                         |
| --------- | -------------------------------------------------------------------------- |
| RPC       | `rpc_get_affiliate_rank_leaderboard(p_limit, p_window)`                    |
| 점수      | `referrals` 행 중 `state IN ('qualified','paid')` **건수** (referrer 기준) |
| 창        | `all_time` · `30d` · `7d` (`qualified_at` 기준; NULL이면 `created_at`)     |
| 상한      | `p_limit` 1–100 (기본 50)                                                  |
| 표시명    | username/display_name **마스킹** (`ab***`) — PII 최소                      |
| self      | 로그인 시 본인 rank · count 포함 (없으면 `null`)                           |
| Money     | **원장 이동 0** — read-only aggregate                                      |
| 가짜 랭킹 | **금지** — RPC 없으면 UI defer stub 유지                                   |

### 2. CMS / promotions schema 확장

| 컬럼                    | 역할                                                           |
| ----------------------- | -------------------------------------------------------------- |
| `audience`              | `all` · `authenticated` · `referrer` · `new_user` (기본 `all`) |
| `min_tier` / `max_tier` | `earn_vip_tier` nullable — 등급 게이트                         |
| `schedule_publish_at`   | `status=scheduled`일 때 자동 publish 시각                      |

| 객체                                    | 역할                                                   |
| --------------------------------------- | ------------------------------------------------------ |
| `rpc_list_cms_content`                  | targeting 필드 노출 · 기존 published 창 유지 (INVOKER) |
| `rpc_admin_upsert_cms_content`          | targeting + schedule write · reason audit payload      |
| `rpc_admin_list_cms_content`            | targeting 필드 포함                                    |
| `rpc_run_cms_publish_scheduled`         | due scheduled → published (service/admin)              |
| pg_cron `phonara_cms_publish_scheduled` | 매 15분 UTC (idempotent)                               |

**영구 제외:** 광고·설문 미션 (E0) — CMS promo kind는 마케팅 카피만 · mission catalog와 분리.

### 3. Viral analytics (admin)

| 객체                            | 역할                                                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `rpc_admin_get_viral_analytics` | referrals by state · affiliate link counts · viral mission claim totals · commission rollup · leaderboard preview Top 10 |
| Admin desk                      | `/viral-stats` hook → 본 RPC (샘플 truncation **제거**)                                                                  |
| Share events                    | **gap** 유지 (E9) — `shareEventsAvailable=false`                                                                         |

### 4. Money / security

- Leaderboard · CMS schedule · analytics = **머니 이동 없음** (Σ=0 영향 0)
- Admin RPCs: `_is_admin()` + `_assert_admin_aal2()`
- `rpc_get_affiliate_rank_leaderboard`: `authenticated` · `auth.uid()` optional self
- Internal helpers: `REVOKE` from `anon`/`authenticated`
- CMS table: 기존 RLS/GRANT 유지 · 컬럼만 확장

### 5. UI unlock (WAVE vs GATE vs E5)

| 단계                                 | 내용                                                                                                      |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| **본 WAVE**                          | ADR + migration + leaderboard RPC + CMS targeting/schedule + viral analytics RPC + admin viral-stats hook |
| **GATE** `ew-e3-gate-cms-promotions` | `test:sql` · `stack:push-remote` · advisor 0 · launch gate unlock                                         |
| **E5** `ew-e5-gap-surfaces-wire`     | `/referral/leaderboard` stub → live wire                                                                  |

WAVE에서 `LAUNCH_GATES.viralCmsEngine = true` · `referralLeaderboardLive = false` (GATE 전 defer).

## Consequences

- `/referral/leaderboard`는 GATE/E5 전까지 defer stub · **가짜 Top N 금지**
- `/admin/cms` · promotions desk는 targeting/schedule 필드 소비 가능 (full promotions desk UI = E6)
- `/admin/viral-stats`는 full aggregate RPC 정본
- Remote: WAVE 후 GATE에서 `test:sql` → `stack:push-remote` → advisor 0

## Verification

| Gate   | 기대                                                                                                         |
| ------ | ------------------------------------------------------------------------------------------------------------ |
| SQL    | `ew_e3_viral_cms_test.sql` — rank order · window · CMS targeting upsert · schedule publish · analytics authz |
| Grants | leaderboard anon deny · analytics admin only · publish scheduled service/admin                               |
| Vitest | `viral-cms-display-contract` · affiliate leaderboard branch exists · defer until gate                        |
| Remote | GATE: `stack:push-remote` · advisor 0 ERROR                                                                  |

## Operator sign-off

Cursor Plan todo `ew-e3-viral-cms-wave` 배정·구현 지시 = 본 ADR Accepted + 동일 PR 엔진.
