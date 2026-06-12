# PHONARA Launch Status

> Derived dashboard only. The source of truth remains
> [`PHONARA_V2_MASTER_PLAN.md`](PHONARA_V2_MASTER_PLAN.md), especially the Build
> Log. Update this file from the master plan; do not use it to override product,
> security, money, or launch decisions.

## Last Verified Green Gates

- Full local RC gate: `bun run check:full` → standard check, PWA, fresh DB reset, SQL 37/37, casino SQL parity, and browser E2E 41/41 passed on 2026-06-12.
- Remote migration apply: locked Supabase project `yocjhjsdwoijfdrehzoq` is aligned through `20260611000079`.
- Remote advisor/lint: `supabase db lint --linked --level error` green; MCP security/performance advisors show 0 ERROR.
- RC read-only production smoke: remote flags safe, web/admin login surfaces and PWA/offline assets boot with the remote publishable key.
- Launch-ops read-only check: cron jobs active; open ops alerts, pending queues, pending withdrawals, active risk flags, and open STR cases are all 0.
- Release cleanliness: `bun run check:release` green after the latest launch-plan and runbook updates.
- Focused wallet/admin E2E: `phase5-wave9.spec.ts` + `admin.spec.ts` → 15/15 passed after the KRW deposit confirmation closeout.
- Focused i18n/admin/casino UI E2E: `admin.spec.ts` + `casino.spec.ts` + `visual.spec.ts` → 16/16 passed after local Auth restart.

## Launch Plan Position

Completed launch-plan closeout items:

- Backend invariant closeout.
- RLS/RPC grant closeout.
- Money-flow matrix closeout.
- Product UX hook pipeline.
- Casino hook pipeline.
- Wallet/Admin UX confirmation closeout.
- i18n UI closeout.
- E2E matrix.
- E2E green.
- Ops runbook.
- Current status doc.
- Incident drill.
- Release candidate readiness.

Current slice:

- `rc-smoke`: read-only production smoke is green; authenticated production flow smoke is blocked until a real operator/user account exists for no-mutation smoke.

Next slices:

- Launch operations loop.

## Current Evidence Map

- E2E ownership and coverage: [`QUALITY_GATES.md`](QUALITY_GATES.md#current-e2e-matrix).
- Operator incident flow: [`RUNBOOK.md`](RUNBOOK.md).
- Observability and secret policy: [`OBSERVABILITY_PRIVACY.md`](OBSERVABILITY_PRIVACY.md).
- Supabase access/RLS inventory notes: [`SUPABASE_ACCESS_MATRIX.md`](SUPABASE_ACCESS_MATRIX.md).

## Known Launch Notes

- Remote migration history is aligned through `20260611000079`.
- Local `check:advisors` still skips without `SUPABASE_ACCESS_TOKEN`, but MCP advisor checks currently show 0 ERROR.
- `db diff --linked` default-direction output includes reverse drift/noise (`pg_net`); the desired `linked -> local` diff produced no SQL, and the generated reverse migration attempt was rejected by local SQL gates and deleted.
- Production `auth.users=0`, so wallet/trading/casino/admin authenticated smoke was not executed. `setup/MANUAL_TASKS.md` now carries the first operator account and no-mutation smoke checklist. Do not create persistent fake users or funded production data just to close this item.
- Remote `reconciliation_log` is still empty after migration apply. AI MCP SQL runs as `supabase_read_only_user` and cannot execute service-role-only `rpc_run_reconciliation()`, so launch-ops requires a first Dashboard/service-role manual or scheduled reconciliation green check before launch-day operations can start.
- Affiliate browser E2E and explicit locale-toggle E2E are not separate browser specs yet because the corresponding shipped user/admin UX is not exposed as a dedicated route. Current coverage is SQL/admin-pattern/check based and is documented in the E2E matrix.
- If local Playwright global setup fails with `createUser failed: {}`, check `http://127.0.0.1:54444/auth/v1/health`. In the latest run this was a local Auth upstream issue and recovered with `supabase stop && supabase start`.
- **Performance backlog (not a code defect)**: Under full-gate load (`check:full`, ~20 prior E2E specs), `rpc_spot_market_buy` was observed exceeding 45s once while isolated `core-flow` runs completed in ~7s. `useSpotActions` busy/ref teardown is correct; E2E now polls `spot_trades` for RPC completion. Recommend pre-launch load testing to measure spot/futures RPC p95 latency.
