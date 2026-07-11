# ENGINE_GAP E2 Missions (#242)

> **상태:** `[x]` DONE · **날짜:** 2026-07-11  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `ew-e2-missions-wave` (#242)  
> **ADR:** [`011-mission-catalog.md`](../PRODUCT/ADR/011-mission-catalog.md)  
> **코드 계약:** [`mission-catalog-display-contract.ts`](../../apps/web/src/domain/mission-catalog-display-contract.ts)  
> **선행:** E1 GATE `#241` `[x]`  
> **후행:** `ew-e2-gate-missions` (#243) **`[x]`** — [`ENGINE_GAP_E2_GATE_MISSIONS.md`](ENGINE_GAP_E2_GATE_MISSIONS.md)

## 범위

| 항목             | 내용                                                                  |
| ---------------- | --------------------------------------------------------------------- |
| ADR              | allowlist catalog · app_config sync write · 광고·설문 영구 제외       |
| Migration        | `20260802000001_ew_e2_mission_catalog.sql`                            |
| RPC              | `rpc_admin_list_mission_catalog` · `rpc_admin_upsert_mission_catalog` |
| Claim gate       | hidden/disabled → `mission_hidden` / `mission_disabled`               |
| Admin write path | hook upsert ready · **write UI = GATE `[x]`**                         |

## 증거

| Gate                                                 | 결과                                        |
| ---------------------------------------------------- | ------------------------------------------- |
| `gate:ai-impl` mission-catalog + admin missions desk | vitest (closeout)                           |
| SQL                                                  | `ew_e2_mission_catalog_test.sql` E2-0..E2-4 |
| Remote                                               | GATE: `stack:push-remote` · advisor 0       |

## 다음

`ew-e2-gate-missions` **`[x]` DONE** — 후행 `ew-e3-viral-cms-wave`.
