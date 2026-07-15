# R4 — Market Ops · Observability (`audit-r4-market-ops`)

> **Stage:** R4 · **Plan todo:** `audit-r4-market-ops`  
> **Findings:** H-04 · EXT-01 · M-20 · C-02 follow-up (public status live)  
> **Date:** 2026-07-13  
> **Command:** Implement (3 migration tranches · Edge deploy · ADR-021 dry-fire · Web `/status` wire)

## Finding touched

| Finding    | Fix summary                                                                                                                           | Gate         |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| **H-04**   | price-feed/crypto-watcher outcome counts · `partial`/`circuit_open`/`rpc_failed`/`missing_config` · HTTP body `ok` = provider outcome | Edge + SQL   |
| **EXT-01** | ADR-021 Option A live · `stack:ops-alert-dry-fire` open→resolve 6/6 trigger keys · correlation via `x-request-id`                     | Ops script   |
| **M-20**   | `auth_rls_initplan` 26→**0** · `multiple_permissive_policies` 36→**2** residual (`sports_sport_catalog` service ALL∩public SELECT)    | advisor      |
| **C-02+**  | `rpc_get_public_platform_status` + `/status` live wire · fetch fail → fail-closed unknown                                             | RPC + vitest |

## Root cause / fix

| 필드                    | 값                                                                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Root cause (H-04)**   | `price-feed` recorded `edge_ops_events.status=ok` when `submitted>0` even if majority failed; HTTP always `ok:true`  |
| **Fix (H-04)**          | `classifyEdgeOpsOutcome` · metadata `{applied,rejected,circuitOpen,rpcFailed}` · status enum expansion · Edge deploy |
| **Root cause (EXT-01)** | Observability/alert stack decided in ADR-021 but not executed                                                        |
| **Fix (EXT-01)**        | dry-fire script + existing `ops_alerts`/`ops-notify` path · trigger key mapping Evidence                             |
| **Root cause (M-20)**   | Post-E8/E9/E10 policies reintroduced bare `auth.uid()` / split admin+own SELECT                                      |
| **Fix (M-20)**          | wrap initplan tranche + consolidate permissive SELECT (meaning-preserving OR)                                        |
| **Public status**       | sanitized lanes only (no providerHealth/edgeOps dumps) · anon EXECUTE                                                |
| **Rebase**              | `rpc_admin_rebase_resume_market` — Admin+AAL2 · quorum≥2 · median/outlier · bulk CSV/`*` forbidden                   |

## Code owners

| Path                                                                                       | Role                                     |
| ------------------------------------------------------------------------------------------ | ---------------------------------------- |
| `supabase/migrations/20260819000001_h04_r4a_edge_ops_public_status_rebase.sql`             | edge_ops status · public status · rebase |
| `supabase/migrations/20260820000001_m20_r4b_rls_perf_initplan.sql`                         | auth_rls_initplan wrap                   |
| `supabase/migrations/20260821000001_m20_r4c_rls_permissive_consolidate.sql`                | permissive consolidate                   |
| `supabase/functions/price-feed` · `crypto-chain-watcher` · `_shared/edge-observability.ts` | false-green fix                          |
| `apps/web/src/domain/system-status-display-contract.ts` · `system-status-page.tsx`         | `/status` live                           |
| `scripts/ops-alert-dry-fire.ts`                                                            | ADR-021 dry-fire                         |

## Gates

```text
bun run lock:migrations → 239 total
bun run stack:push-remote → 3 migrations · advisor ERROR 0
performance advisor: auth_rls_initplan 26→0 · multiple_permissive 36→2 residual
bun run stack:ops-alert-dry-fire → opened 6/6 · resolved 6/6
supabase functions deploy price-feed · crypto-chain-watcher → OK
gate:ai-impl (system-status + edge-ops-outcome) → 8/8
remote probe: rpc_get_public_platform_status overall=degraded · lanes=5 · anon EXECUTE=true
```

## Remote probe (2026-07-13)

| Check                                   | Result                              |
| --------------------------------------- | ----------------------------------- |
| `rpc_get_public_platform_status` lanes  | **5**                               |
| anon EXECUTE public status              | **true**                            |
| `rpc_admin_rebase_resume_market` exists | **true**                            |
| security advisor ERROR                  | **0**                               |
| auth_rls_initplan                       | **0**                               |
| multiple_permissive (targeted)          | **2** residual sports_sport_catalog |

## No Shortcut checklist

- [x] silent `ok` fallback on partial price-feed **removed**
- [x] HTTP 2xx ≠ provider success (body `ok`/`outcome`)
- [x] public status leaks no secrets/raw provider dumps
- [x] rebase bulk forbidden · AAL2 · quorum
- [x] RLS wrap/consolidate does not widen GRANT
- [x] migration rewrite 없음 · 1 pending push each tranche
- [x] ADR-021 dry-fire Evidence (open→resolve)

Finding status: **H-04 / EXT-01 / M-20 → VERIFIED_FIXED** (Backend/DB · residual multi-perm 2 documented).

NEXT Implement: **`audit-r5-admin-safety`**.
