# ENGINE_GAP E3 Viral+CMS (#244)

> **상태:** `[x]` DONE · **날짜:** 2026-07-11  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `ew-e3-viral-cms-wave` (#244)  
> **ADR:** [`012-viral-cms.md`](../PRODUCT/ADR/012-viral-cms.md)  
> **코드 계약:** [`viral-cms-display-contract.ts`](../../apps/web/src/domain/viral-cms-display-contract.ts)  
> **선행:** E2 GATE `#243` `[x]`  
> **후행:** `ew-e3-gate-cms-promotions` (#245)

## 범위

| 항목      | 내용                                                                                                     |
| --------- | -------------------------------------------------------------------------------------------------------- |
| ADR       | leaderboard · CMS targeting/schedule · viral analytics · 가짜 랭킹 금지                                  |
| Migration | `20260803000001_ew_e3_viral_cms.sql`                                                                     |
| RPC       | `rpc_get_affiliate_rank_leaderboard` · `rpc_admin_get_viral_analytics` · `rpc_run_cms_publish_scheduled` |
| CMS       | `audience` · `min_tier`/`max_tier` · `schedule_publish_at` + list/upsert 확장                            |
| Admin     | `/viral-stats` → analytics RPC (샘플 truncation 제거)                                                    |
| UI unlock | leaderboard live = GATE (`referralLeaderboardLive`) · E5 wire                                            |

## 증거

| Gate                                                          | 결과                                  |
| ------------------------------------------------------------- | ------------------------------------- |
| `gate:ai-impl` viral-cms + affiliate/referral/cms/viral-stats | **23/23**                             |
| SQL                                                           | `ew_e3_viral_cms_test.sql` E3-0..E3-4 |
| Remote                                                        | GATE: `stack:push-remote` · advisor 0 |

## 다음

`ew-e3-gate-cms-promotions` **`[x]` DONE** — `test:sql` · `stack:push-remote` · unlock `/referral/leaderboard` · `/admin/promotions` · `/admin/cms` · `/announcements` full.
