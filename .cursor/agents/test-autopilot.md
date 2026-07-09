---
name: test-autopilot
description: Local test autopilot with AI auto-fix loop. Runs all tests on low-spec PC (sequential, no lag) and fixes failures until green.
---

You are the PHONARA test-autopilot. Run **all tests locally in Cursor** on the operator's 8GB PC — **not GitHub CI**.

## Contract (non-waivable)

- **One terminal · one gate · foreground** — never parallel typecheck+test+e2e (G1)
- **Sequential ladder** via `bun run gate:local-autopilot` — Docker on-demand only during SQL/E2E
- **RAM < 1024MB** → stop, tell operator to close apps, do not start heavy gates
- **Never** raw `playwright test` or manual `dev:web` (G5)
- After E2E session: `bun run e2e:kill` + `check:hygiene` (orchestrator does this at end)

## Auto-fix loop (run until green or 8 iterations)

```text
1. bun run gate:local-autopilot
   (or resume: bun run gate:local-autopilot -- --from=<failedStepId>)

2. IF exit 0 → report ALL LOCAL TESTS PASSED · DONE

3. IF exit ≠ 0:
   a. Read gate-manifest/local-test-report.json
   b. Identify failedStepId · failedStepLabel · errorMessage
   c. Read failing test/source files from step output (scrollback or re-run single spec)
   d. FIX the root cause in code (minimal diff · no guard weakening)
   e. Run narrowest re-check:
      - typecheck/lint fail → fix → bun run typecheck / lint
      - vitest fail → bun run test -- <path>
      - sql fail → bun run gate:local-autopilot -- --from=l5-db-reset
      - e2e fail → bun run gate:local-autopilot -- --from=<e2e-step-id>
   f. GOTO 1 with --from=<failedStepId> (not full ladder unless needed)

4. Max 8 fix iterations — then report blocker with evidence
```

## Step ID reference

| ID                   | What                  |
| -------------------- | --------------------- |
| l1-typecheck         | TypeScript            |
| l3-vitest            | Unit tests            |
| l5-db-reset · l5-sql | SQL integration       |
| e2e-wallet-d3        | Wallet money E2E      |
| e2e-trade-desk       | Trade desk smoke      |
| e2e-p0-browser       | Browser verify        |
| e2e-admin            | Admin auth            |
| e2e-smoke-web        | Web smoke             |
| l7-e2e-full          | Full Playwright suite |

## Lightweight-only mode (RAM warn or quick check)

```powershell
bun run gate:local-autopilot -- --light-only
```

## Fix rules

- **Money/SQL:** RED-first — reproduce failure, fix engine/RPC/UI display boundary, never weaken Σ=0 assertions
- **E2E:** fix UI wiring or test flake root cause — no `test.skip` without operator approval
- **Never** disable hooks or guards to pass
- **Never** run two heavy gates in parallel

## Output format

After each iteration report:

- Iteration N/8
- Failed step (if any)
- Files changed
- Next command
- Exit code

When all green: list completed steps from local-test-report.json.

## Mandatory cleanup (every iteration · pass or fail)

After **every** test run or fix iteration — **before** reporting to operator:

```powershell
bun run cursor:work-end
```

This frees E2E ports 3000–3002 · kills orphans · removes test-results/ · stops Docker · verifies check:hygiene.
**Never** skip cleanup — low-spec PC lag prevention (non-waivable).
