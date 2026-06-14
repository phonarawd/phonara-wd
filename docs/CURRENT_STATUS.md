# PHONARA Launch Status

> Derived dashboard only. The source of truth remains
> [`PHONARA_V2_MASTER_PLAN.md`](PHONARA_V2_MASTER_PLAN.md), especially the Build
> Log. Update this file from the master plan; do not use it to override product,
> security, money, or launch decisions.

## Last Verified Green Gates

- Full local RC gate: `bun run check:full` → standard check, PWA, fresh DB reset, SQL 37/37, casino SQL parity, and browser E2E 41/41 passed on 2026-06-12.
- Remote migration apply: locked Supabase project `yocjhjsdwoijfdrehzoq` is aligned through **`20260615000098`** (casino 088–096, crypto 097, viral 098).
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

## Lovable Zenith UI (parallel track · Lovable workspace)

> **정본:** [`LOVABLE_ZENITH_SESSION_HANDOFF.md`](LOVABLE_ZENITH_SESSION_HANDOFF.md) §1 · **새 채팅 bootstrap:** [`LOVABLE_ZENITH_NEW_CHAT.md`](LOVABLE_ZENITH_NEW_CHAT.md) · **실행 플랜:** [`LOVABLE_ZENITH_MASTER_PLAN.md`](LOVABLE_ZENITH_MASTER_PLAN.md)  
> **PHONARA repo:** casino game UI = placeholder until Lovable ZIP paste (engine no-touch).

| Item | Status (2026-06-14) |
|------|---------------------|
| Macro Phase 0–2 | ✅ GREEN (Lovable local) |
| Macro Phase 3 (5 P1 games) | 🟡 Plinko ✅ · Limbo ✅ · **Mines next** · HiLo/Dice ⏳ |
| Macro Phase 4–10 | ⏳ (4 new games + shell + Earn + 32 pages + Admin + ZIP) |
| Casino games done | **3/10** (crash, plinko, limbo) · Limbo vitest 40/40 · red:grep ALL 0 |
| Next Lovable turn | **Mines** (Crash template copy) · §1-F hotfix ✅ + preview PASS |
| e2e pending | crash + plinko + limbo WRITTEN → CI/local PASS · back smoke 3 spec |
| PHONARA paste | After Lovable Phase 10 export — not started |

## Current Evidence Map

- E2E ownership and coverage: [`QUALITY_GATES.md`](QUALITY_GATES.md#current-e2e-matrix).
- Operator incident flow: [`RUNBOOK.md`](RUNBOOK.md).
- Observability and secret policy: [`OBSERVABILITY_PRIVACY.md`](OBSERVABILITY_PRIVACY.md).
- Supabase access/RLS inventory notes: [`SUPABASE_ACCESS_MATRIX.md`](SUPABASE_ACCESS_MATRIX.md).

## Known Launch Notes

- Remote migration history is aligned through **`20260615000098`** (`yocjhjsdwoijfdrehzoq`). Includes casino 088–096, crypto rails 097, viral missions 098.
- `database.types.ts` regen from linked DB: **`game_code` 10 values**; `crypto_*` tables + `viral_mission_code` enum present.
- Local SQL integration: **`bun run test:sql` → 41/41** after ENGINE 100 migrations (crypto deposit Σ=0, viral conservation).
- Remote `db lint --linked --level error` and `check:advisors` → **0 ERROR** (2026-06-14).
- Production **`rpc_run_reconciliation()`** executed once via linked query → all 5 check families **`is_match=true`**, `system_readonly` not set.
- Local `check:advisors` still skips without `SUPABASE_ACCESS_TOKEN`, but MCP advisor checks currently show 0 ERROR.
- `db diff --linked` default-direction output includes reverse drift/noise (`pg_net`); the desired `linked -> local` diff produced no SQL, and the generated reverse migration attempt was rejected by local SQL gates and deleted.
- Production **`auth.users=2`** (2026-06-14 verify): one `profiles.role=admin`, one `profiles.role=user`. Authenticated prod smoke remains **no-mutation** until operator confirms MFA + checklist in `setup/MANUAL_TASKS.md`.
- Affiliate browser E2E and explicit locale-toggle E2E are not separate browser specs yet because the corresponding shipped user/admin UX is not exposed as a dedicated route. Current coverage is SQL/admin-pattern/check based and is documented in the E2E matrix.
- If local Playwright global setup fails with `createUser failed: {}`, check `http://127.0.0.1:54444/auth/v1/health`. In the latest run this was a local Auth upstream issue and recovered with `supabase stop && supabase start`.
- **Local manual signup/login**: `.env.local` must use `VITE_SUPABASE_URL=http://127.0.0.1:54444` and the publishable key from `supabase status`. Local `config.toml` disables email confirmation so signup goes straight to the dashboard. After `supabase db reset`, clear browser Local Storage (`sb-*` keys) once — stale refresh tokens otherwise spam `/auth/v1/token` with 400. Inbucket catches auth emails at http://127.0.0.1:54424 when testing magic links.
- **Performance backlog (not a code defect)**: Under full-gate load (`check:full`, ~20 prior E2E specs), `rpc_spot_market_buy` was observed exceeding 45s once while isolated `core-flow` runs completed in ~7s. `useSpotActions` busy/ref teardown is correct; E2E now polls `spot_trades` for RPC completion. **ENGINE 100 scope:** oracle-perp excellence + documented p95 SLO is sufficient; **full Binance-grade CLOB is a separate multi-month program**, not a launch blocker for current architecture (display order book, not matching engine).

## Spot RPC latency (isolated · local · 2026-06-14)

Measured via `scripts/measure-spot-rpc-p95.ts` against local stack (`http://127.0.0.1:54444`), **N=40**, spot rate limits temporarily disabled for probe only (`rate_limits_disabled_for_probe: true`).

| RPC | p50 | p95 | p99 | min | max |
|-----|-----|-----|-----|-----|-----|
| `rpc_spot_market_buy` | **349 ms** | **1847 ms** | **2221 ms** | 18 ms | 2221 ms |
| `rpc_spot_market_sell` | **404 ms** | **2776 ms** | **3110 ms** | 27 ms | 3110 ms |

**SLO note:** Isolated p95 under 3s for spot buy/sell on local Docker; production p95 should be re-measured after operator account exists. Full-gate contention can push tail latency higher (see backlog above).
