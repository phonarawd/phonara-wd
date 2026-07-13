# R5 — Admin Safety (`audit-r5-admin-safety`)

> **Stage:** R5 · **Plan todo:** `audit-r5-admin-safety`  
> **Findings:** H-07 · H-08 · M-12 · M-13 · M-02 · M-17  
> **Date:** 2026-07-13  
> **Command:** Implement per PLATFORM_AUDIT_TODO_HANDOFF.md

## Finding touched

| Finding  | Fix summary                                                                                                 | Gate                           |
| -------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------ |
| **H-07** | desktop/mobile/group children → `isAdminNavRouteAllowed` · empty groups hidden · deep-link redirect `/`     | vitest nav-filter + route gate |
| **H-08** | Earn settlement: `can(earn.settlement.approve)` → reason dialog ≥4 → RPC `p_reason` · hardcoded reason 제거 | earn-page + desk hook          |
| **M-12** | `/users/$id/tier` owner write UI · `users.tier.write` · reason dialog · refetch                             | user-tier page                 |
| **M-13** | agents tab 제거(deferred card) · CMS/promotions/casino EmptyState → `refresh()`                             | no-op 0                        |
| **M-02** | `formatAdminMoney` (`@phonara/money`) · tiers/missions/viral-stats + wallet helper                          | format-admin-money             |
| **M-17** | aggregate probe 3/12 · never-signin · wallet 0 → `banned_until=2099` · triage runbook                       | SQL + ops doc                  |

## Root cause / fix

| 필드                  | 값                                                                |
| --------------------- | ----------------------------------------------------------------- |
| **Root cause (H-07)** | nav가 team/support만 필터 · allowlist 미적용                      |
| **Fix (H-07)**        | `filterAdminNavEntries` 단일 predicate · mobile 동일 · route gate |
| **Root cause (H-08)** | 승인 버튼 즉시 RPC · 고정 사유 문자열                             |
| **Fix (H-08)**        | referrals와 동일 dialog+RBAC 경로                                 |
| **Root cause (M-12)** | `writeUiUnlocked=true`인데 page read-only                         |
| **Fix (M-12)**        | owner-only write card + dialog                                    |
| **Root cause (M-13)** | agents stub tab · EmptyState `() => undefined`                    |
| **Fix (M-13)**        | tab 제거 · refresh wire                                           |
| **Root cause (M-02)** | raw `${amount} PHON`                                              |
| **Fix (M-02)**        | Decimal formatAdminMoney                                          |
| **Root cause (M-17)** | test-like 3건 UNVERIFIED                                          |
| **Fix (M-17)**        | probe+ban · ledger 삭제 0 · triage doc                            |

## Code owners

| Path                                                                          | Role           |
| ----------------------------------------------------------------------------- | -------------- |
| `apps/admin/src/product/layout/admin-nav*.ts(x)`                              | H-07           |
| `apps/admin/src/hooks/use-admin-route-gate.ts`                                | H-07 deep-link |
| `apps/admin/src/product/surfaces/admin-earn-page.tsx` · `useAdminEarnDesk.ts` | H-08/M-13      |
| `apps/admin/src/product/surfaces/admin-user-tier-page.tsx` · `admin-rbac.ts`  | M-12           |
| `apps/admin/src/product/surfaces/admin-{cms,casino,promotions}-page.tsx`      | M-13           |
| `apps/admin/src/lib/format-admin-money.ts`                                    | M-02           |
| `docs/OPERATIONS/PLATFORM_AUTH_TEST_ACCOUNT_TRIAGE.md` · spotcheck SQL        | M-17           |

## Gates

```text
gate:ai-impl L0~L4 green · vitest 26/26 (owner suite)
check:i18n · check:release · typecheck green
M-17 remote: banned=3 · sessions_deleted=0 · nonzero wallet=0
```

## Role negative (H-07)

| Role    | Must not see                                       |
| ------- | -------------------------------------------------- |
| viewer  | /withdrawals · /team · /deposits · /earn/referrals |
| finance | /team · /earn/referrals (activity only)            |
| owner   | /team · /mfa/policy visible                        |

## No Shortcut checklist

- [x] allowlist predicate wired (not team/support-only)
- [x] settlement mutation without reason **0**
- [x] tier write flag/UI 정합
- [x] EmptyState no-op **0**
- [x] raw PHON concat on 3 desks **0**
- [x] M-17 PII not committed · financial history not deleted

Finding status: **H-07 / H-08 / M-12 / M-13 / M-02 / M-17 → VERIFIED_FIXED**

NEXT Implement: **`audit-r6-product-consistency`**.
