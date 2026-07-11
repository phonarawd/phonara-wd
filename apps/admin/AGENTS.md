# apps/admin — Phase R

> **Phase R:** Admin desks live — [`REBUILD_PLAN_v1.md`](../../docs/PRODUCT/REBUILD_PLAN_v1.md) · **NEXT** `p13-soft-launch-bundle` (#233) · T0-A `#232` `[x]` · ops Web Push `#231` `[x]` · team desk `#230` `[x]` · Admin canonical docs `#229` `[x]` · W8 GATE `#228` `[x]`.

## KEEP (engine glue + product desks)

`hooks/admin/` · `domain/` · `contracts/` · `lib/auth.ts` · `contexts/auth-context.tsx` · `product/surfaces/` · `product/primitives/admin-table.tsx` · `routes/` · `features/ops-push/` · `public/sw.js`

## Admin ops Web Push (§32.6 Gap A-4 · P13 INFRA `#231`)

- **CTA:** `/settings` 「알림 받기 (휴대폰)」 · deep-link `/queues`
- **Store:** `push_subscriptions` (existing) · SW `public/sw.js`
- **Dispatch:** edge `ops-notify` → `WEB_PUSH_DISPATCH_URL` (+ ntfy Click via `OPS_ADMIN_PUBLIC_URL`)
- **코드:** `domain/admin-ops-push-display-contract.ts` · `features/ops-push/admin-ops-web-push.ts`

## Admin team desk (§29.5 · P13 UI `#230`)

- **Route:** `/team` · `AdminTeamPage` · `useAdminTeamDesk`
- **RPC:** `rpc_admin_list_role_grants` · `rpc_admin_set_role_grant` (owner + AAL2)
- **Nav:** owner only · settings → 「직원 권한 관리로 가기」
- **Canon:** [`ADMIN_TEAM_RBAC_CANON.md`](../../docs/SSOT/ADMIN_TEAM_RBAC_CANON.md)

## Admin canonical docs (§29.5 · P13 DOC `#229`)

- **초등어:** [`ADMIN_BEGINNER_LANGUAGE_CANON.md`](../../docs/SSOT/ADMIN_BEGINNER_LANGUAGE_CANON.md)
- **RBAC:** [`ADMIN_TEAM_RBAC_CANON.md`](../../docs/SSOT/ADMIN_TEAM_RBAC_CANON.md)
- **유저↔Admin:** [`PHONARA_USER_ADMIN_CORRESPONDENCE_MATRIX.md`](../../docs/PHONARA_USER_ADMIN_CORRESPONDENCE_MATRIX.md)
- **코드:** `domain/admin-beginner-language-display-contract.ts`
- **다음:** `p13-soft-launch-bundle` (#233) — T0-A `#232` **`[x]`**

## T0-A Prod Preflight (P13 OPS `#232`)

- **Canon:** [`P13_T0A_PROD_PREFLIGHT.md`](../../docs/OPERATIONS/P13_T0A_PROD_PREFLIGHT.md)
- **코드:** `domain/p13-ops-prod-preflight-display-contract.ts`
- **Spotcheck:** `scripts/p13-ops-prod-preflight-spotcheck.sql`
- **다음:** `p13-soft-launch-bundle` (#233)

## AdminTable (§29.6)

- **정본:** `apps/admin/src/product/primitives/admin-table.tsx` · `@tanstack/react-table`
- Desk 목록 = **AdminTable만** — native `<table>` · 로컬 `LoadingTable` **금지**
- GATE: `admin-table-dedup-display-contract` · `p2-gate-admin-table-dedup` **`[x]`** 2026-07-11
- Vite/vitest alias: `@/product/primitives/admin-table` → admin local (web primitives alias보다 우선)

## High-risk RBAC (R0 · PIR P1)

- `useAdminOperatorRbac` — authority = `rpc_admin_list_role_grants` · **fail-closed** (viewer) while loading/error
- localStorage role preview = **DEV only** — production cannot elevate to owner via storage
- `canPerformAdminAction` gates queues · withdrawals · rewards · ops kill/halt
- Kill switches mounted on `/ops` via `confirmKillSwitch`
- Desk route SOT: `domain/admin-security-display-contract.ts` (no `/casino` · `/cms` ghosts)

## Gates

`bun run gate:ai-impl -- --test apps/admin/src/...`
