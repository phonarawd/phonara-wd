# ENGINE_GAP E9 Admin Support Desk

> **상태:** `[x]` DONE · **날짜:** 2026-07-12  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `ew-e9-page-admin-support`  
> **선행:** E9 GATE `ew-e9-gate-identity-support` `[x]`  
> **후행:** `ew-e10-platform-engine-wave`  
> **코드 계약:** [`admin-support-desk-display-contract.ts`](../../apps/admin/src/domain/admin-support-desk-display-contract.ts)

## 범위 (§29.5 · §12.14)

| 항목        | 내용                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------ |
| Route       | `/admin/support` (`apps/admin` → `/support`)                                                     |
| Surface     | `AdminSupportPage` · `AdminTable` only                                                           |
| Hook        | `useAdminSupportDesk`                                                                            |
| RPCs        | `rpc_admin_list_support_tickets` · `rpc_admin_resolve_support_ticket` · `rpc_get_support_ticket` |
| RBAC        | owner · support (viewer/finance **deny**)                                                        |
| Queues 수렴 | open/in_progress 건수 → `/admin/queues` exception summary · CTA 양방향                           |

## 증거

| Gate                         | 결과                                               |
| ---------------------------- | -------------------------------------------------- |
| `gate:ai-impl` admin-support | vitest display + page · typecheck · i18n · release |
| Engine                       | E9 WAVE/GATE — remigration **0**                   |

## 다음

`ew-e10-platform-engine-wave`
