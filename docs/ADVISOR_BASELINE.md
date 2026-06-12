# Supabase Advisor Baseline

Remote security/performance advisor snapshot for the locked project. Use this file to
detect **new** WARN/INFO categories or count deltas on future `bun run check:advisors`
runs. The gate **fails only on ERROR**; WARN/INFO are tracked here for drift control.

## Capture metadata

| Field | Value |
|---|---|
| Captured | 2026-06-13 |
| Project ref | `yocjhjsdwoijfdrehzoq` |
| Source | `bun run check:advisors` (Management API, remote linked project) |
| ERROR | **0** |
| WARN | **212** |
| INFO | **109** |
| Gate result | `check:advisors OK — security advisor has 0 ERROR` |

## WARN — full classification (212)

| Rank | Lint name | Count | Category | Money / security | Baseline disposition |
|---:|---|---:|---|---|---|
| 1 | `multiple_permissive_policies` | 108 | RLS policy shape | Security (RLS) | **Accepted** — layered policies per role/action by design; advisor prefers single policy per action |
| 2 | `authenticated_security_definer_function_executable` | 57 | Definer exposure | **Security** (includes money `rpc_*`) | **Accepted** — client `rpc_*` are `SECURITY DEFINER` with `auth.uid()` / `_is_admin()` body guards; `anon` revoked on internal helpers |
| 3 | `auth_rls_initplan` | 40 | RLS planner | Security (RLS perf) | **Accepted** — known `auth.uid()` / JWT initplan pattern on client-facing tables; tracked, not blocking |
| 4 | `function_search_path_mutable` | 3 | Function hardening | **Security** | **Watch** — residual functions without pinned `search_path`; migration 000013+ addressed bulk; re-check if count rises |
| 5 | `extension_in_public` | 1 | Extension placement | **Security** | **Accepted** — `pgcrypto` lives in `extensions` schema per rule 25; advisor may still flag historical `public` references |
| 6 | `anon_security_definer_function_executable` | 1 | Definer exposure | **Security (critical)** | **Watch** — must stay at 0–1 known exceptions; any **increase** triggers manual review (rule 25: revoke unguarded definer from `anon`) |
| 7 | `auth_leaked_password_protection` | 1 | Auth config | **Security** | **Deferred** — 대시보드 설정 대기 — 인간 결정 사항 |
| 8 | `auth_insufficient_mfa_options` | 1 | Auth config | **Security** (admin MFA) | **Deferred** — admin은 AAL2 해결 / 일반 사용자 MFA는 출시 후 백로그 |

**WARN total:** 108 + 57 + 40 + 3 + 1 + 1 + 1 + 1 = **212**

### Top 5 WARN types (summary)

1. `multiple_permissive_policies` — **108**
2. `authenticated_security_definer_function_executable` — **57**
3. `auth_rls_initplan` — **40**
4. `function_search_path_mutable` — **3**
5. `extension_in_public` — **1** (tied at 1 with three other types; ranked above alphabetically later types)

### (a) Money / security–related WARN types

| Lint name | Count | Note |
|---|---:|---|
| `authenticated_security_definer_function_executable` | 57 | Includes wallet, trading, casino, withdrawal, and other `rpc_*` surfaces; guarded definer pattern |
| `anon_security_definer_function_executable` | 1 | Highest sensitivity — any new row is a privilege review item |
| `function_search_path_mutable` | 3 | Search-path injection hardening |
| `multiple_permissive_policies` | 108 | RLS scope / least-privilege shape |
| `auth_rls_initplan` | 40 | RLS evaluation on authenticated paths |
| `extension_in_public` | 1 | Extension schema placement |
| `auth_leaked_password_protection` | 1 | Auth-tier password breach checking |
| `auth_insufficient_mfa_options` | 1 | Auth-tier MFA configuration |

No WARN type is classified as a **confirmed money conservation bug**; money correctness is enforced by SQL integration tests and ledger invariants, not advisor WARNs.

### (b) Intentionally accepted / deferred (one-line rationale)

| Lint name | Rationale |
|---|---|
| `multiple_permissive_policies` | Multiple explicit policies per table/role are intentional for grant+RLS pairing and admin vs own-read splits. |
| `authenticated_security_definer_function_executable` | PostgREST exposes `rpc_*`; authorization is enforced inside the function body, not by `SECURITY INVOKER`. |
| `auth_rls_initplan` | Standard Supabase RLS pattern; policies are correct; planner hint only. |
| `extension_in_public` | Crypto helpers are schema-qualified to `extensions`; advisor lint is informational legacy noise. |
| `function_search_path_mutable` | Residual count after bulk `search_path` pin migrations; treat **increases** as regressions. |
| `anon_security_definer_function_executable` | Baseline allows one known residual; **zero tolerance for growth** without review. |
| `auth_leaked_password_protection` | 대시보드 설정 대기 — 인간 결정 사항 |
| `auth_insufficient_mfa_options` | admin은 AAL2 해결 / 일반 사용자 MFA는 출시 후 백로그 |

## INFO — full classification (109)

| Lint name | Count | Baseline disposition |
|---|---:|---|
| `unused_index` | 68 | **Accepted** — conservative indexes for future query paths; review if count spikes after large schema drops |
| `unindexed_foreign_keys` | 41 | **Accepted** — append-only / low-volume FK paths; add indexes when admin queue latency warrants |

**INFO total:** 68 + 41 = **109**

## Drift detection procedure

1. Run `bun run check:advisors` with `SUPABASE_ACCESS_TOKEN` set (see `.env.example`).
2. Compare stdout breakdown to this file:
   - **FAIL gate** if ERROR > 0.
   - **Investigate** if any **new lint name** appears in WARN or INFO.
   - **Investigate** if count for `anon_security_definer_function_executable`, `function_search_path_mutable`, or any ERROR-class name **increases**.
   - **Investigate** if total WARN increases by more than **+5** without a documented migration (RLS split often adds `multiple_permissive_policies` noise).
3. After intentional remediation, update this baseline in the same PR as the migration.

## Related gates

- Local schema correctness: `supabase db reset` + `bun run test:sql`
- Remote advisor (this baseline): `bun run check:advisors`
- Strict full gate: `PHONARA_ADVISORS_STRICT=1 bun run check:full`
