# ENGINE_GAP E1 Tier Decay (#240)

> **상태:** `[x]` DONE · **날짜:** 2026-07-11  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `ew-e1-decay-wave` (#240)  
> **ADR:** [`010-tier-decay.md`](../PRODUCT/ADR/010-tier-decay.md)  
> **코드 계약:** [`tier-decay-display-contract.ts`](../../apps/web/src/domain/tier-decay-display-contract.ts)  
> **선행:** E0 `#239` `[x]`  
> **후행:** `ew-e1-gate-decay` (#241)

## 범위

| 항목      | 내용                                                    |
| --------- | ------------------------------------------------------- |
| ADR       | 45일 grace · Diamond 60일 · max 1-tier · warn 30/15/7/3 |
| Migration | `20260801000001_ew_e1_tier_decay.sql`                   |
| RPC       | `rpc_run_tier_decay` · `rpc_get_tier_decay_status`      |
| Mission   | `tier_keep_status` progress live · monthly claim        |
| Notify    | `notification_outbox` `tier_decay_warning`              |
| Cron      | `phonara_tier_decay_daily` 03:15 UTC                    |

## 증거

| Gate                                                | 결과                                   |
| --------------------------------------------------- | -------------------------------------- |
| `gate:ai-impl` tier-decay + dead-controls + tier-me | vitest (closeout)                      |
| SQL                                                 | `ew_e1_tier_decay_test.sql` E1-0..E1-4 |
| Remote                                              | `stack:push-remote` · advisor 0        |

## 다음

`ew-e1-gate-decay` — test:sql · stack:push-remote · advisor 0 · `/tier/me` full unlock.
