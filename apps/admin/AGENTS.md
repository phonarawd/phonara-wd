# apps/admin — Phase R

> **Phase R:** Admin desks live — [`REBUILD_PLAN_v1.md`](../../docs/PRODUCT/REBUILD_PLAN_v1.md) · **NEXT** `ew-e10-wallet-settings-ui` · E10 Admin KRW proof `[x]` · E10 WAVE `[x]` · E9 Admin support `[x]` · E9 GATE `[x]` · E9 WAVE `[x]` · E8–E0 · T2/T1 · P13 · DA · Soft Launch `[x]`.

## KEEP (engine glue + product desks)

`hooks/admin/` · `domain/` · `contracts/` · `lib/auth.ts` · `contexts/auth-context.tsx` · `product/surfaces/` · `product/primitives/admin-table.tsx` · `routes/` · `features/ops-push/` · `public/sw.js`

## Admin support desk (§29.5 · E9 UI `ew-e9-page-admin-support`)

- **Route:** `/support` · `AdminSupportPage` · `useAdminSupportDesk`
- **RPC:** `rpc_admin_list_support_tickets` · `rpc_admin_resolve_support_ticket`
- **Nav:** owner · support · queues open-ticket 수렴
- **Canon:** [`ENGINE_GAP_E9_ADMIN_SUPPORT.md`](../../docs/OPERATIONS/ENGINE_GAP_E9_ADMIN_SUPPORT.md)

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
- Soft Launch `#233` **`[x]`** — [`P13_SOFT_LAUNCH_BUNDLE.md`](../../docs/OPERATIONS/P13_SOFT_LAUNCH_BUNDLE.md)

## T0-A Prod Preflight (P13 OPS `#232`)

- **Canon:** [`P13_T0A_PROD_PREFLIGHT.md`](../../docs/OPERATIONS/P13_T0A_PROD_PREFLIGHT.md)
- **코드:** `domain/p13-ops-prod-preflight-display-contract.ts`
- **Spotcheck:** `scripts/p13-ops-prod-preflight-spotcheck.sql`
- Soft Launch `#233` **`[x]`** · **다음** `da-w7-enforcement-strict-tokens` (#234)

## Soft Launch Bundle (P13 BUNDLE `#233`)

- **Canon:** [`P13_SOFT_LAUNCH_BUNDLE.md`](../../docs/OPERATIONS/P13_SOFT_LAUNCH_BUNDLE.md)
- **Web contract:** `apps/web/src/domain/p13-soft-launch-display-contract.ts`
- **Admin spot-check:** `domain/__tests__/p13-soft-launch-admin-spotcheck.test.ts`
- Soft Launch `#233` **`[x]`**

## T1 Live Ramp Feature Gates (P13 OPS `#237`)

- **Canon:** [`P13_T1_LIVE_RAMP_FEATURE_GATES.md`](../../docs/OPERATIONS/P13_T1_LIVE_RAMP_FEATURE_GATES.md)
- **코드:** `domain/p13-t1-live-ramp-display-contract.ts`
- **Spotcheck:** `scripts/p13-t1-live-ramp-spotcheck.sql`
- **정책:** weekly rails spot·futures·casino·sports ON · OI **40%** · daily loop 09:00 queues/ops
- T1 `#237` **`[x]` DONE**

## T2 Scale Triggers (P13 OPS `#238`)

- **Canon:** [`P13_T2_SCALE_TRIGGERS.md`](../../docs/OPERATIONS/P13_T2_SCALE_TRIGGERS.md)
- **코드:** `domain/p13-t2-scale-triggers-display-contract.ts`
- **Spotcheck:** `scripts/p13-t2-scale-triggers-spotcheck.sql`
- **정책:** DAU 500~2K / 2K~10K / 10K+ · per-user notional · read replica · hedge 검토 (B-book 기본)
- **다음:** `ew-e4-tier-option-b-wave` (#246) · E3 GATE `#245` `[x]`

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
- Desk route SOT: `domain/admin-security-display-contract.ts` (E6 desks live · no `/operations` · `/overview` ghosts)

## Gates

`bun run gate:ai-impl -- --test apps/admin/src/...`
