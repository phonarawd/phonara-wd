# PHONARA — Cursor Agents Entry

> **Active SSOT:** [`docs/SSOT/ACTIVE_WORK_SSOT.md`](docs/SSOT/ACTIVE_WORK_SSOT.md)  
> **Engine:** `[x] FULLY CLOSED` (2026-07-03) — status [`ENGINE_APEX_CLOSEOUT.md`](docs/ENGINE_APEX_CLOSEOUT.md) only · **구현 큐 0**  
> **Demolition:** `[x] DONE` — batch 재실행 없음  
> **Next:** Phase R — [`REBUILD_PLAN_v1.md`](docs/PRODUCT/REBUILD_PLAN_v1.md) · **PIR NEXT `pir-closeout-unblock-205`** · Track A `#205` **BLOCKED by PIR GATE** · CasinoR#1 `#204` `[x]` · Casino lobby `#203` `[x]` · Sports#4 `[x]` · Sports#3 `[x]` · Sports#2 `[x]` · Sports#1 `[x]` · Sports#0 `[x]` · Fiat#10 `[x]` · DA W5 GATE `[x]` · DA W5 `[x]` · DA W4 GATE `[x]` · DA W4 `[x]` · DA W3 GATE `[x]` · DA W3 `[x]` · DA W2 GATE `[x]` · DA W2 shell `[x]` · DA W1 GATE `[x]` · DA W1 DS `[x]` · DA W0 `[x]` · R0 forensic `[x]`

Rules: `.cursor/rules/00-post-closeout-active-ssot.mdc` · denylist [`DEPRECATED_DOC_DENYLIST.md`](docs/SSOT/DEPRECATED_DOC_DENYLIST.md)

## Read first

1. [`ACTIVE_WORK_SSOT.md`](docs/SSOT/ACTIVE_WORK_SSOT.md)
2. [`REBUILD_PLAN_v1.md`](docs/PRODUCT/REBUILD_PLAN_v1.md)
3. [`ENGINE_APEX_CLOSEOUT.md`](docs/ENGINE_APEX_CLOSEOUT.md) — gates · 재착수 금지 한 줄

## Do not read as work queue

- Engine evidence phase reports — **감사 이력만** · 실행 큐 아님 ([`DEPRECATED_DOC_DENYLIST.md`](docs/SSOT/DEPRECATED_DOC_DENYLIST.md))
- `DEMOLITION_PLAN` batch rows (DONE)
- v2 deleted SSOT (`UI_REBUILD_WAVE` · `MASTER_TODO` · …) — Batch 11 `git rm`

## Branch workflow (non-waivable)

**`main`에 직접 push 금지** — 오류 시 main이 지저분해짐. feature branch → CI green → PR merge.

```powershell
# 1) main에서 작업 중이면 feature branch로 이동 (커밋·미커밋 변경 유지)
bun run wip:branch -- "da-w2-shell-elevation"

# 2) 마일스톤마다 checkpoint (미완성 OK — phase-r/* · wip/* 만)
bun run wip:checkpoint -- "aurora backdrop policy"

# 3) push는 feature branch만 (main 직접 push 자동 차단)
bun run git:push

# 4) CI green 확인 후 PR → main merge
bun run ci:watch
gh pr create --base main --head $(git branch --show-current)
```

| 브랜치                   | 용도                                       |
| ------------------------ | ------------------------------------------ |
| `main`                   | merge-ready only · 직접 작업/push **금지** |
| `phase-r/<topic>-<date>` | Phase R 구현 큐 (정본)                     |
| `wip/<topic>`            | 레거시 WIP (허용)                          |

## Gates

> **로컬 전체 테스트 (Cursor):** `gate:local-autopilot` · `@test-autopilot` — 순차 · RAM 가드 · Docker on-demand  
> **CI push-fix loop:** push → `ci:watch` → red면 AI fix → re-push — [`94-ci-push-fix-loop.mdc`](.cursor/rules/94-ci-push-fix-loop.mdc) · skill `ci-push-fix-loop`  
> **CI (선택):** push → `ci:watch` — [`CI_GATE_AUTHORITY.md`](docs/SSOT/CI_GATE_AUTHORITY.md)

### AI — 로컬 orchestrator (허용)

- `bun run gate:local-autopilot` — SQL+E2E **순차** 1터미널 (hook 통과 · 내부에서 heavy gate 실행)
- `@test-autopilot` — 실패 시 자동 fix loop (`--from=<step>` 재개)

### AI MUST NOT (직접 heavy gate · hook 차단)

- `bun run test:e2e` / `test:sql` / `supabase db reset` / `check:full` / `gate:phase-r` **직접** 실행

| Gate                      | 로컬 (Cursor)                                                         | 비고                                      |
| ------------------------- | --------------------------------------------------------------------- | ----------------------------------------- |
| Implemented closeout      | `gate:ai-impl -- --test <path> --closeout <todo-id> --evidence "..."` | L0~L4 green 후 **Plan YAML·§82 doc 자동** |
| Plan todo only            | `closeout:todo -- <todo-id> --evidence "..."`                         | gate 이미 green일 때                      |
| **전체 테스트**           | `gate:local-autopilot` · `@test-autopilot`                            | 저사양 순차                               |
| typecheck · lint · vitest | L0~L4                                                                 | 항상 OK                                   |
| test:e2e/sql 직접         | ❌                                                                    | orchestrator만                            |
| CI (선택)                 | `ci:watch` after push                                                 | GitHub                                    |

### 로컬 전체 테스트 (operator 기본)

```powershell
@test-autopilot
# 또는
bun run gate:local-autopilot
# 실패 재개: bun run gate:local-autopilot -- --from=<step-id>
```

### Push → CI green (push-fix loop)

Operator 「푸시 전 완벽하게」 / 「CI green까지」 시 skill **`ci-push-fix-loop`** · rule **`94-ci-push-fix-loop.mdc`**:

```powershell
# 1) Pre-push L0~L4 + Plan closeout (operator 수동 체크 0)
bun run gate:ai-impl -- --test <owner-vitest-path> --closeout <todo-id> --evidence "gate:ai-impl ... green · N/N"
bun run format:check

# 2) Commit + push (operator 명시 시)
git push origin <branch>

# 3) Watch → red면 gh log/artifact로 fix → re-push (최대 5회)
bun run ci:watch
gh run view <run-id> --log-failed
```

Required jobs: **quality · sql · e2e · advisors**. 로컬 heavy gate **금지** (G13).

### Push → CI (단순 확인)

```powershell
bun run gate:ai-impl -- --test <owner-vitest-path>
bun run git:push
bun run ci:watch
```

## Monorepo

| Path                                                  | Role                                         |
| ----------------------------------------------------- | -------------------------------------------- |
| `packages/*-engine`, `money`, `wallet-ledger`, `i18n` | **KEEP** — frozen                            |
| `supabase/`                                           | **KEEP** — frozen                            |
| `apps/web`, `apps/admin`                              | Engine glue + Phase D stub → Phase R rebuild |

## Subagents

| Agent              | When                                |
| ------------------ | ----------------------------------- |
| `gate-runner`      | Phase R surface gate                |
| `test-autopilot`   | 로컬 전체 테스트 + 자동 fix loop    |
| `security-auditor` | migration/RPC touch (operator 승인) |
| `verifier`         | closeout claims                     |

**작업/테스트 후 필수:** `bun run cursor:work-end` (AI 자동 · hook 보조)

Day 0: `bun run cursor:autopilot-setup` · [`CURSOR_AUTOPILOT.md`](docs/SSOT/CURSOR_AUTOPILOT.md)
