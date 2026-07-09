---
name: session-hygiene
description: PHONARA Cursor session hygiene — purge orphans, free E2E ports, clean artifacts. Use when Cursor lags, after E2E, or before starting heavy gates.
---

# PHONARA Session Hygiene

## Lag triage (RAM vs disk)

- **RAM stutter (free RAM low):** close Claude Desktop / browser / extra Electron — **compact does NOT free RAM**
- **Disk/I/O (vscdb bloat):** Track C after quitting Cursor — see [`docs/rebuild/LOWSPEC_RULES.md`](../../docs/rebuild/LOWSPEC_RULES.md)
- `cursor:status` — read-only; **do not run every agent turn** (I/O spike)

## Quick status

```powershell
bun run cursor:status
```

## When to purge

- Cursor lag / freeze
- Hung vitest or Playwright
- Ports 3000–3002 still listening
- `test-results/` or E2E auth tokens on disk

## Commands (pick one)

| Situation                              | Command                                                                |
| -------------------------------------- | ---------------------------------------------------------------------- |
| **Idle clean slate (operator 1-shot)** | `bun run cursor:idle`                                                  |
| Full purge (recommended)               | `bun run cursor:purge`                                                 |
| Environment audit                      | `bun run cursor:env-doctor` · `cursor:env-doctor -- --fix`             |
| Stale old workspaces                   | `bun run cursor:clean-stale-workspaces -- --apply` (Cursor quit first) |
| Render argv merge (manual)             | `bun run cursor:render-fix`                                            |
| Repo-only emergency                    | `bun run cursor:emergency-reset`                                       |
| Session end (full)                     | `bun run cursor:work-end`                                              |
| Session end (alias)                    | `bun run cursor:session-end`                                           |
| After E2E                              | `bun run e2e:kill` then `bun run clean`                                |
| Agent turn stop (hook)                 | `cursor:agent-stop` — residue/ports 있으면 자동 정리                   |
| Verify clean                           | `bun run check:hygiene`                                                |

## Docker (on-demand)

- **OFF** during normal UI/typecheck work
- **ON** only via `pretest:e2e*` / `pretest:sql`
- **OFF** after `posttest:*` → `stack:stop` (default quits Docker Desktop)

Setup once: `bun run stack:docker:setup -- --apply-wslconfig --apply-env`

## Never

- `stack:ensure --full` in sessionStart (G11)
- Leave Docker Desktop ON when idle on low-spec PC
- Start second E2E terminal while first is hung — Ctrl+C once, then `e2e:kill`

Reference: `.cursor/rules/78-cursor-auto-hygiene.mdc` · `83-session-purge-contract.mdc` · `84-docker-on-demand.mdc`
