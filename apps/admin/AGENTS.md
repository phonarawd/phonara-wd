# apps/admin — Phase R

> **Phase R:** Admin desks live — [`REBUILD_PLAN_v1.md`](../../docs/PRODUCT/REBUILD_PLAN_v1.md) · **NEXT** `da-w2-shell-elevation-infra` (#188) · DA W1 GATE `[x]` · DA W1 `[x]` · DA W0 `[x]` · R0 forensic `[x]`.

## KEEP (engine glue + product desks)

`hooks/admin/` · `domain/` · `contracts/` · `lib/auth.ts` · `contexts/auth-context.tsx` · `product/surfaces/` · `routes/`

## High-risk RBAC (R0)

- `useAdminOperatorRbac` / `canPerformAdminAction` gate queues · withdrawals · rewards · ops kill/halt
- Kill switches mounted on `/ops` via `confirmKillSwitch`
- Desk route SOT: `domain/admin-security-display-contract.ts` (no `/casino` · `/cms` ghosts)

## Gates

`bun run gate:ai-impl -- --test apps/admin/src/...`
