# apps/admin — Phase R

> **Phase R:** Admin desks live — [`REBUILD_PLAN_v1.md`](../../docs/PRODUCT/REBUILD_PLAN_v1.md) · **NEXT** `p2-gate-admin-table-dedup` (#207) · AdminTable `#206` `[x]` · §29.6.

## KEEP (engine glue + product desks)

`hooks/admin/` · `domain/` · `contracts/` · `lib/auth.ts` · `contexts/auth-context.tsx` · `product/surfaces/` · `product/primitives/admin-table.tsx` · `routes/`

## AdminTable (§29.6)

- **정본:** `apps/admin/src/product/primitives/admin-table.tsx` · `@tanstack/react-table`
- Desk 목록 = **AdminTable만** — native `<table>` · 로컬 `LoadingTable` **금지**
- Vite/vitest alias: `@/product/primitives/admin-table` → admin local (web primitives alias보다 우선)

## High-risk RBAC (R0 · PIR P1)

- `useAdminOperatorRbac` — authority = `rpc_admin_list_role_grants` · **fail-closed** (viewer) while loading/error
- localStorage role preview = **DEV only** — production cannot elevate to owner via storage
- `canPerformAdminAction` gates queues · withdrawals · rewards · ops kill/halt
- Kill switches mounted on `/ops` via `confirmKillSwitch`
- Desk route SOT: `domain/admin-security-display-contract.ts` (no `/casino` · `/cms` ghosts)

## Gates

`bun run gate:ai-impl -- --test apps/admin/src/...`
