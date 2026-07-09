---
name: local-test-autopilot
description: Run ALL PHONARA tests locally in Cursor on 8GB PC without lag — sequential gate ladder + AI auto-fix loop. Use when operator wants local testing (not GitHub CI) with automatic failure repair.
---

# Local Test Autopilot (Cursor · 저사양)

> **Operator intent:** GitHub 없이 Cursor에서 전체 테스트 + 실패 시 AI 자동 수정.

## Quick start

```powershell
# Operator or agent invokes test-autopilot subagent, or:
bun run gate:local-autopilot
```

## Low-spec safeguards (렉 방지)

| Rule                | Implementation                                       |
| ------------------- | ---------------------------------------------------- |
| 한 번에 gate 1개    | `gate:local-autopilot` sequential spawn              |
| Docker 상시 ON 금지 | `pretest:e2e`/`pretest:sql`만 ON · `stack:stop` 종료 |
| RAM < 1024MB        | heavy gate 전 abort (exit 2)                         |
| E2E spec 1개씩      | wallet → trade → admin → smoke → full                |
| Hang 복구           | Ctrl+C → e2e:kill → `--from=<step>`                  |

## Auto-fix loop

1. `bun run gate:local-autopilot`
2. Fail → read `gate-manifest/local-test-report.json`
3. Fix code (minimal scope)
4. `bun run gate:local-autopilot -- --from=<failedStepId>`
5. Repeat until green (max 8 iterations)

Invoke **`@test-autopilot`** subagent for hands-free fix loop.

## Commands

| Command                                                | Purpose                             |
| ------------------------------------------------------ | ----------------------------------- |
| `bun run gate:local-autopilot`                         | Full local ladder                   |
| `bun run gate:local-autopilot -- --from=e2e-wallet-d3` | Resume from step                    |
| `bun run gate:local-autopilot -- --light-only`         | typecheck+lint+vitest only          |
| `bun run gate:local-autopilot -- --skip-e2e`           | No Playwright                       |
| `bun run gate:ai-impl -- --test <path>`                | Narrow pre-check before full ladder |

## What runs (full ladder)

```text
L0 hygiene → L1 typecheck/lint/i18n/release → L3 vitest
→ L5 db reset + test:sql
→ E2E specs (5 targeted) → L7 full test:e2e
→ teardown (e2e:kill · stack:stop · hygiene)
```

## FAIL signals

- RAM critical → close apps, retry `--from=`
- Parallel gates → G1 violation — stop immediately
- 8 iterations without green → report blocker to operator

Reference: `docs/rebuild/E2E-LOWSPEC-RUNBOOK.md` · `.cursor/agents/test-autopilot.md`
