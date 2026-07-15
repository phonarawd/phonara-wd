---
name: ci-push-fix-loop
description: Push to GitHub, watch CI (ci:watch), fix failures from logs/artifacts with local L0-L4 only, re-push until quality·sql·e2e·advisors green. Use when operator asks for perfect push, push-fix loop, or CI green before done.
---

# CI Push-Fix Loop

GitHub CI is **authoritative** for SQL/E2E. Agent fixes CI reds without running local heavy gates (G13).

## When to use

- Operator: 「푸시 전 완벽하게」, 「CI green까지」, 「push-fix loop」
- After implementation closeout before claiming Verified/DONE
- After `git push` when operator wants autonomous CI repair

## Phase 1 — Pre-push (local)

```powershell
Set-Location c:\Users\PC\Desktop\phonara-gb
bun run cursor:status
bun run typecheck
bun run lint
bun run format:check
bun run check:i18n
bun run check:release
bun run check:hygiene
bun run check:ai-reference
bun run gate:ai-impl -- --test <changed-test-path>
```

Fix all errors in **one batch**, then rerun failed gates once.

**Do not commit:** `.env`, `.cursor/.phonara-render-fix-at`, `.tmp/`

## Phase 2 — Commit & push

Only when operator explicitly requested commit/push (or standing grant in same session).

**`main` 직접 push 금지** — `bun run wip:branch`로 feature branch 확인 후:

```powershell
git add <relevant files>
git commit -m "fix(scope): why not what list"
bun run git:push          # feature branch only — main push auto-blocked
```

## Phase 3 — Watch CI

```powershell
bun run ci:watch
# or poll: gh run list --workflow=ci.yml --branch $(git branch --show-current) --limit 1
# detail: gh run view <run-id>
# logs:   gh run view <run-id> --log-failed
```

Exit 0 → report **CI VERIFIED**. Exit 1 → Phase 4.

## Phase 4 — Triage & fix

### quality (typecheck / lint / test / build)

1. `gh run view <id> --log-failed`
2. Common: `bun run format` · fix vitest · remove unused vars · doc sync tests
3. Re-run failing local gate, then commit + push

### sql (db reset + check:types + test:sql)

1. If **Database types drift**: download artifact  
   `gh run download <id> -n database-types-ci-expected -D .tmp-ci-types`  
   Copy to `packages/shared-types/src/database.types.ts`
2. If **SQL test allowlist**: update `supabase/tests/*_inventory_test.sql` / `engine_foundation_baseline_test.sql`
3. **Do not** run local `test:sql` unless operator 「gate 실행」— fix from CI log text

### e2e

1. Read Playwright failure from `--log-failed` or uploaded artifact
2. Fix with targeted vitest + code; **no** local `bun run test:e2e` (G13)
3. Re-push; let CI e2e job verify

### advisors

- Remote security advisor ERROR → migration/RPC review; may need `stack:push-remote`
- Engine freeze: operator RED STOP before new migrations

## Phase 5 — Loop

Repeat Phase 2–4 until `ci:watch` reports all required jobs green or **5 cycles** reached.

After each push session: `bun run cursor:work-end`

## Required vs advisory

| Job                                   | Blocks Verified       |
| ------------------------------------- | --------------------- |
| quality, sql, e2e, advisors           | **Yes**               |
| e2e-browser-matrix, format (advisory) | **No** — mention only |

## Reference session pattern (2026-07-09)

1. Pre-push gates + `gate:ai-impl`
2. Push → CI red: `format:check`, types drift, SQL allowlist
3. Fixes: Prettier, CI artifact types, `rpc_get_synthetic_book` allowlist, observability doc test
4. Re-push → sql/e2e/advisors green; quality fixed on final commit

See: `.cursor/rules/94-ci-push-fix-loop.mdc` · `docs/SSOT/CI_GATE_AUTHORITY.md`
