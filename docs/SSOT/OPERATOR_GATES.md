# Operator Gates — Low-Spec Entrypoint

> **1페이지 entrypoint.** 규칙 정본은 `.cursor/rules/80-absolute-gate-prohibitions.mdc` (G1–G13).  
> **CI authoritative 정본:** [`CI_GATE_AUTHORITY.md`](CI_GATE_AUTHORITY.md) — **저사양 PC는 heavy gate를 GitHub에 위임.**  
> 상세 runbook은 아래 링크만 — 본 문서에서 규칙 재기술 최소화 (drift 방지).

## 저사양 operator — 표준 워크플로 (2026-07-06)

```text
로컬: gate:ai-impl · typecheck · lint  (Docker OFF)
Push: git push / PR → GitHub Actions CI
판정: CI green = Verified  (로컬 E2E/SQL로 DONE 주장 금지)
```

| CI job (`.github/workflows/ci.yml`) | 위임 내용                                                          |
| ----------------------------------- | ------------------------------------------------------------------ |
| **quality**                         | typecheck · lint · vitest · build · i18n · release · pwa           |
| **sql**                             | db reset · test:sql 118 · Σ=0                                      |
| **e2e**                             | `test:e2e` full suite · wallet Σ=0 · trade-desk-smoke · admin auth |
| **advisors**                        | remote Supabase advisor 0 ERROR                                    |

Push 후: GitHub **Actions → CI** green 확인 · red면 **push-fix loop** (`.cursor/rules/94-ci-push-fix-loop.mdc`) — 로그/artifact triage → L0~L4 fix → re-push (로컬 full E2E/SQL **금지**).

상세: [`CI_GATE_AUTHORITY.md`](CI_GATE_AUTHORITY.md)

## Execution contract (non-waivable)

| Rule          | Requirement                                                                                                                                   |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Terminals     | **One terminal** per heavy gate session                                                                                                       |
| Concurrency   | **One heavy gate at a time** — never 2+ of typecheck/lint/test/build/check/check:full/test:e2e\*                                              |
| Background    | Heavy gate in **background shell forbidden**                                                                                                  |
| Foreground    | Wait for **exit code** before next step                                                                                                       |
| Hang recovery | `cursor:emergency-reset` or E2E cleanup **before** retry same gate                                                                            |
| Session end   | After E2E/build/check → residue cleanup + `check:hygiene`                                                                                     |
| Authoritative | **GitHub Actions CI** — local heavy red/green is advisory only · operator 일상은 **CI 위임** ([`CI_GATE_AUTHORITY.md`](CI_GATE_AUTHORITY.md)) |
| Agent L5–L8   | **Forbidden** autonomously — operator 「gate 실행」 or CI only                                                                                |

## Gate ladder (summary)

```text
L0  cursor:status · check:hygiene · check:ui-architecture
L1  typecheck · check:i18n · check:release
L2  lint
L3  targeted vitest (--test path)
    gate:ai-impl -- --test <path>  = L0–L3 wrapper (AI todo closeout)
L4  full vitest (wide impact only)
— L5–L8: operator / CI only (G13) —
L5  supabase db reset → test:sql → stack:push-remote
L6  targeted E2E (single spec)
L7  full test:e2e
L8  check:full · gate:phase-r manifest
L9  doc closeout sync (82-work-doc-closeout-sync)
```

## Agent may run (lightweight · always OK)

```powershell
bun run cursor:status
bun run check:hygiene
bun run check:ui-architecture
bun run typecheck
bun run lint
bun run check:i18n
bun run check:release
bun run gate:ai-impl -- --test <owner-vitest-path>
```

## Operator or CI only (heavy)

```powershell
bun run test:e2e*
bun run test:sql
supabase db reset
bun run stack:push-remote
bun run check:full
# full visual diff · Docker+Supabase stack for gates
```

Operator runs **one** named spec/SQL when chat says **「gate 실행」** — **1회**, no retry, no full suite by default.

## Session start checklist

```powershell
Set-Location c:\Users\PC\Desktop\phonara-gb
bun run cursor:status
# orphan/residue → cursor:emergency-reset or cursor:purge
```

- [ ] orphan 0 · ports 3000–3002 free
- [ ] Docker **OFF** unless pretest:e2e / pretest:sql
- [ ] dev server **one** only

## Cursor index · repo外 plans 정리 (P8 · operator 수동)

`.cursorignore` / `.vscode/settings.json` watcher 변경 후 **Cursor 완전 재시작**(트레이 포함) 필수.

### Repo 내 (자동 검증)

```powershell
bun run cursor:sync-excludes
bun run check:hygiene
```

- [ ] `docs_archive/` · `docs/archive/` · `tests/visual/mockups/` · `tests/visual/m0-baselines/` ignore 확인
- [ ] `check:hygiene` green

### Repo 밖 — `%USERPROFILE%\.cursor\plans\` (수동 · 1회 또는 분기)

Cursor Plans는 git repo 밖에 쌓여 index lag·혼선 원인. **최종 plan 1개만** 유지.

```powershell
# 미리보기 (삭제 안 함)
Get-ChildItem "$env:USERPROFILE\.cursor\plans" -Filter *.plan.md |
  Sort-Object LastWriteTime -Descending |
  Select-Object Name, LastWriteTime, Length

# 정본 유지 예: final_ui_reset_*.plan.md — operator가 확정한 1개만 남김
# 구 plan 삭제 또는 별도 archive (예: Desktop\phonara-plan-archive\)
#   ai_reset_ui_rebuild_*.plan.md
#   full_ui_rebuild_*.plan.md
#   worldclass-*.plan.md
#   phonara_*.plan.md
```

- [ ] `%USERPROFILE%\.cursor\plans\` — **활성 plan 1개**만 (Final UI Reset SSOT)
- [ ] 구 plan은 삭제 또는 repo/git 밖 archive 폴더로 이동
- [ ] Cursor tray 포함 **완전 종료** → 재시작

### Repo 밖 — 기타 (선택 · 월 1회)

| 경로                                                 | 조치                                                     |
| ---------------------------------------------------- | -------------------------------------------------------- |
| `%USERPROFILE%\.cursor\projects\…\agent-transcripts` | `bun run cursor:clean-metadata` (dry-run → `--apply`)    |
| `%APPDATA%\Cursor\logs` (80MB+)                      | `cursor:clean-metadata -- --apply --include-cursor-logs` |
| `%APPDATA%\Cursor\User`                              | **삭제 금지** (설정·상태)                                |

## Hang / lag recovery

```powershell
bun run cursor:status
bun run cursor:emergency-reset
# E2E hang: Ctrl+C once → wait teardown → bun run e2e:kill
```

## E2E (operator/CI)

- **Never:** raw `playwright test`, manual `dev:web` + browser
- **Always:** `bun run test:e2e -- tests/e2e/<target>.spec.ts`
- Teardown: `bun run e2e:kill` + `bun run check:hygiene`

## Detailed runbooks (maintained until SSOT merge verified)

| Topic                                  | Document                                                                                                   |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **CI authoritative · local vs GitHub** | [`CI_GATE_AUTHORITY.md`](CI_GATE_AUTHORITY.md)                                                             |
| Operator checklist · lag triage        | [`docs/rebuild/LOWSPEC_RULES.md`](../rebuild/LOWSPEC_RULES.md)                                             |
| E2E targets · teardown                 | [`docs/rebuild/E2E-LOWSPEC-RUNBOOK.md`](../rebuild/E2E-LOWSPEC-RUNBOOK.md)                                 |
| Phase R turnkey L0→L8                  | [`docs/rebuild/PHASE-R-GATE-RUNBOOK.md`](../rebuild/PHASE-R-GATE-RUNBOOK.md)                               |
| Phase D operator D1–D7                 | [`docs/rebuild/PHASE-D-GATE-RUNBOOK.md`](../rebuild/PHASE-D-GATE-RUNBOOK.md)                               |
| Gate matrix                            | [`docs/QUALITY_GATES.md`](../QUALITY_GATES.md)                                                             |
| Agent entry                            | [`AGENTS.md`](../../AGENTS.md)                                                                             |
| Rules G13                              | [`.cursor/rules/80-absolute-gate-prohibitions.mdc`](../../.cursor/rules/80-absolute-gate-prohibitions.mdc) |

## AI Implemented closeout (single command)

```powershell
bun run gate:ai-impl -- --test <owner-vitest-path>
```

Green → `[x] impl partial`. Full `[x] DONE` requires operator L5–L8 only.

## P0.6 completion

- [x] Single-page low-spec entrypoint fixed at `docs/SSOT/OPERATOR_GATES.md`
- [x] One terminal · one heavy gate · foreground · L5–L8 operator/CI only
- [x] Legacy runbooks linked, not duplicated

## P0 Edge Contracts closeout — `[x] DONE` (2026-07-03)

DB migration(`p0_edge_contracts_claim_webhook`)과 Edge deploy는 **별도**. 아래 lightweight gate로 operator advisory 확인.

| Gate                         | Command                               | DONE 조건       |
| ---------------------------- | ------------------------------------- | --------------- |
| 9종 edge health + Vault cron | `bun run stack:verify-worldno1-edge`  | exit 0 · 9/9 OK |
| PG webhook HMAC (no JWT)     | `bun run stack:smoke-pg-webhook-hmac` | exit 0 · 5/5 OK |

Edge 재배포 (함수 코드/`config.toml` `verify_jwt` 변경 시):

```powershell
supabase functions deploy notification-dispatch --project-ref yocjhjsdwoijfdrehzoq --use-api --yes
supabase functions deploy ops-notify --project-ref yocjhjsdwoijfdrehzoq --use-api --yes
supabase functions deploy crypto-withdraw-broadcast --project-ref yocjhjsdwoijfdrehzoq --use-api --yes
supabase functions deploy pg-bank-webhook --project-ref yocjhjsdwoijfdrehzoq --no-verify-jwt --use-api --yes
```

증거 정본: [`ENGINE_APEX_CLOSEOUT.md`](../ENGINE_APEX_CLOSEOUT.md) — Phase별 evidence report `.md`는 2026-07-04 워킹트리에서 삭제 (원문 = git history · 파일명은 closeout Phase 매트릭스 참조).

## Engine Apex — `[x] FULLY CLOSED` (2026-07-03)

PrimeForge Engine Apex + Post-Apex P1/P2. **엔진 구현 큐 0.** 검증 정본: [`ENGINE_APEX_CLOSEOUT.md`](../ENGINE_APEX_CLOSEOUT.md).

| Gate                  | 결과 (Post-Apex 정본)       |
| --------------------- | --------------------------- |
| Package unit (engine) | **275/275**                 |
| `test:sql`            | **118/118**                 |
| `stack:push-remote`   | parity OK · advisor ERROR 0 |
| Migration parity      | **211/211**                 |

Post-Apex evidence: `ENGINE_POST_APEX_P1_P2_EVIDENCE_REPORT.md` (2026-07-04 삭제 — git history)

Prod real-money rehearsal · full E2E · `check:full` — operator/CI only (defer: closeout §의도적 defer).
