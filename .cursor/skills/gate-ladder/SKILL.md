---
name: gate-ladder
description: Run the PHONARA quality gate ladder on low-spec Windows — L0~L4 + gate:ai-impl locally; SQL/E2E/check:full via GitHub CI after push (G13). Use when verifying work or before closeout.
---

# PHONARA Gate Ladder

Execute gates **sequentially**. One heavy command per terminal. Foreground only.

> **8GB operator · CI authoritative:** SQL · E2E · check:full = **GitHub Actions** — 로컬 L5~L8 일상 **금지**.  
> 정본: [`docs/SSOT/CI_GATE_AUTHORITY.md`](../../docs/SSOT/CI_GATE_AUTHORITY.md)

## Preflight

```powershell
Set-Location c:\Users\PC\Desktop\phonara-gb
bun run cursor:status
```

If orphans or ports 3000–3002 occupied:

```powershell
bun run cursor:purge
# or: bun run cursor:emergency-reset
```

## Ladder

| L           | Command                                                                | When                                                       | Agent                                  |
| ----------- | ---------------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------- |
| **AI impl** | `bun run gate:ai-impl -- --test <path>`                                | **Todo Implemented closeout — run this one command**       | **자율 OK**                            |
| L0          | `bun run check:hygiene`                                                | After E2E/build or if residue suspected                    | 자율 (또는 gate:ai-impl 내부)          |
| L1          | `bun run typecheck`                                                    | Always after TS changes — batch-fix all errors, rerun once | 자율                                   |
| L2          | `bun run lint`                                                         | After L1 green                                             | 자율                                   |
| L3          | `bun run test -- <path>`                                               | Changed packages/files only                                | 자율                                   |
| L4          | `bun run test`                                                         | Broad domain impact only                                   | 자율 (좁히기 실패 시)                  |
| L5          | `supabase db reset` → `bun run test:sql` → `bun run stack:push-remote` | SQL/migration changes only                                 | **GitHub CI sql job** · agent **금지** |
| L6          | `bun run test:e2e:casino -- tests/e2e/<spec>.spec.ts`                  | UI/E2E surface — pick narrowest spec                       | **GitHub CI e2e job** · agent **금지** |
| L7          | `bun run test:e2e`                                                     | Once, after L6 green                                       | **GitHub CI e2e job** · agent **금지** |
| L8          | `bun run check:full`                                                   | Once, final RC confirmation                                | **operator/CI only** · agent **금지**  |

### AI todo closeout (저사양 · 단일 foreground)

```powershell
bun run gate:ai-impl -- --test apps/web/src/components/sports/__tests__
```

Green → mark todo **`[x] impl partial`** (NOT full DONE). **Push → GitHub CI green → Verified/DONE.**

## E2E teardown (mandatory)

```powershell
bun run e2e:kill
bun run check:hygiene
```

**명령 매트릭스:** `docs/rebuild/E2E-LOWSPEC-RUNBOOK.md`

## E2E configs (pick narrowest)

| L   | Command                                               | When                                      |
| --- | ----------------------------------------------------- | ----------------------------------------- |
| L6a | `bun run test:e2e:sports-engine`                      | Sports RPC only (no UI)                   |
| L6b | `bun run test:e2e:casino -- tests/e2e/<spec>.spec.ts` | Most UI — web server only                 |
| L6c | `bun run test:e2e -- tests/e2e/admin*.spec.ts`        | Admin RBAC — needs 3001                   |
| L6d | `bun run test:e2e:visual`                             | Visual smoke (`visual.spec.ts` only · P6) |

## Fail rules

- Do not run L8 before E2E stable (G3)
- Do not run two of {typecheck, test, build, e2e, check:full} in parallel (G1)
- Do not use raw `playwright test` — hooks deny (G5)
- Docker starts only via `pretest:e2e*` / `pretest:sql` — not sessionStart (G11)

## Closeout (L9)

After gates green for a Step/Phase: Phase D → update `DEMOLITION_PLAN` batch row; Phase R → `82-work-doc-closeout-sync`.

Reference: `.cursor/rules/81-efficient-gate-execution.mdc` · `80-absolute-gate-prohibitions.mdc`
