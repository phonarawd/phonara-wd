# PHONARA v2 — Final Audit Dump

> Closeout gate snapshot. Regenerate after material changes to gates, migrations, or E2E.

## Snapshot metadata

| Field | Value |
|---|---|
| Captured | 2026-06-13 |
| HEAD | `ebc5e7d` |
| Branch | `main` (+37 ahead of `origin/main`) |
| Supabase project | `yocjhjsdwoijfdrehzoq` |
| Verdict | **CLOSEOUT PASS** |

## Commits in this closeout slice

| SHA | Message |
|---|---|
| `14fab90` | fix: env loader for check-env gate |
| `b4bbe80` | fix: e2e conservation — drop mid-suite fundE2EWallet on shared user |
| `ebc5e7d` | chore: add local backup recovery rehearsal script |

## Gate results

| Gate | Command | Result |
|---|---|---|
| Env | `bun run check:env` | **PASS** — `loadRepoEnvFiles` reads `.env` / `.env.local` |
| i18n | `bun run check:i18n` | **PASS** |
| Release cleanliness | `bun run check:release` | **PASS** |
| Remote advisors | `bun run check:advisors` | **PASS** — 0 ERROR, 212 WARN, 109 INFO (baseline: `docs/ADVISOR_BASELINE.md`) |
| Migrations lock | `bun run check:migrations` | **PASS** — 88 migrations |
| Deps | `bun run check:deps` | **PASS** |
| Typecheck | `bun run typecheck` | **PASS** |
| Lint | `bun run lint` | **PASS** |
| Unit tests | `bun run test` | **PASS** — 142 passed, 1 skipped |
| Build | `bun run build` | **PASS** |
| Full check chain | `bun run check` | **PASS** |
| SQL integration | `bun run test:sql` | **PASS** — 41/41 files |
| Playwright E2E | `bun run test:e2e` | **PASS** — 45/45 |

## Advisor WARN baseline (deferred auth items)

| Lint | Disposition |
|---|---|
| `auth_leaked_password_protection` | 대시보드 설정 대기 — 인간 결정 사항 |
| `auth_insufficient_mfa_options` | admin은 AAL2 해결 / 일반 사용자 MFA는 출시 후 백로그 |

## E2E `fundE2EWallet` inventory (post-fix)

| Location | Purpose | Status |
|---|---|---|
| `tests/e2e/global-setup.ts` | Initial shared-user fixture (1M PHON/USDT) | **OK** — once per suite |
| `tests/e2e/casino.spec.ts` `createSecondUser` | New isolated user | **OK** |
| `tests/e2e/funnel.spec.ts` | New-user USDT margin fixture; `futuresBefore` delta after SET | **OK** — documented bypass |
| Mid-suite shared-user SET | Removed from `responsible-gaming`, `casino-wave7-closeout`, `casino.spec`, `admin.spec` | **FIXED** |

Helper JSDoc (`_helpers.ts`): SET bypasses conservation — use only for global-setup / **new** users; prefer per-test `currencyTotals` deltas on shared user.

## Backup / recovery rehearsal (RUNBOOK §3 local path)

| Step | Result |
|---|---|
| `pg_dump` (Docker `supabase_db_yocjhjsdwoijfdrehzoq`) | **PASS** — ~1.39 MB dump |
| Recovery | `supabase db reset` |
| Post-recovery verify | `test:sql` 41/41 **PASS** |
| Script | `bun run rehearsal:backup` |
| Last run | `2026-06-12T23:42:11.540Z` (see `backups/last-rehearsal.json`, gitignored dumps) |

Remote PITR remains **human-only** per RUNBOOK §3.

## Known non-blockers

- Advisor WARN total 212 tracked in `ADVISOR_BASELINE.md` (gate fails only on ERROR).
- `mirror/sql-tests` env loader parity — **deferred** per operator scope.
- Remote migrations 000025–000044 not on linked project until Wave 12 push (advisor scope note).

## CLOSEOUT verdict

**PASS** — All automated launch gates green at HEAD `ebc5e7d`. Remaining human decisions: Auth dashboard (HIBP, rate limits, PITR), withdrawal activation checklist (RUNBOOK §4), general-user MFA backlog.
