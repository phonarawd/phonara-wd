# Phase R — 결함0 최종 게이트 (operator/CI turnkey)

> **정본:** master plan `phaseR-stage` · `phaseR-manifest` · `.cursor/rules/80-absolute-gate-prohibitions.mdc` (G13)  
> **AI Implemented:** `bun run gate:ai-impl -- --test <path>` (L0~L4 only)  
> **Verified / RC:** 본 문서 (L0~L8 · 단일 터미널 · authoritative)

---

## 한 줄 명령 (turnkey)

```powershell
Set-Location c:\Users\PC\Desktop\phonara-gb
bun run gate:phase-r
```

출력: `gate-manifest/phase-r-manifest.json` — commit SHA · branch · gate별 `pass|fail|skip` · `durationMs` · `releaseReady`.

**금지:** 손으로 boolean YAML/checklist 작성 · manifest JSON repo 커밋 · gate 병렬/background (G1).

---

## L0→L8 순서 (단일 터미널 · `gate:phase-r` 내부)

| L   | 단계           | 명령 (개별 디버그 시)                                                                                                                 |
| --- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| L0  | preflight      | `bun run cursor:emergency-reset` → `bun run cursor:status`                                                                            |
| L1  | static         | `bun run typecheck` · `bun run lint` · `bun run test`                                                                                 |
| L1  | product checks | `check:i18n` · `check:release` · `check:design-tokens` · `check:ui-architecture` · `check:hygiene`                                    |
| L5  | SQL / remote   | `supabase db reset` → `bun run test:sql` → `stack:push-remote` → `check:advisors` (strict)                                            |
| L6  | 타겟 E2E       | wallet-d3 · trade-money-path · trade-terminal · sports-d5/ui · earn-d4/hub · casino · wave7 · admin · pwa-install/push · visual smoke |
| L7  | full E2E       | `bun run test:e2e`                                                                                                                    |
| L1  | PWA static     | `bun run check:pwa`                                                                                                                   |
| L8  | RC lite        | `check:full` embedded steps (mirror · guard · reconciliation · casino parity — sql/e2e 중복 없음)                                     |
| —   | teardown       | `bun run e2e:kill` → `bun run cursor:session-end`                                                                                     |

타겟 E2E 명령 표: [`E2E-LOWSPEC-RUNBOOK.md`](E2E-LOWSPEC-RUNBOOK.md) · master plan E2E 매트릭스.

---

## CLI 플래그

| 플래그              | 용도                                                            |
| ------------------- | --------------------------------------------------------------- |
| `--skip-preflight`  | CI — `cursor:emergency-reset` 생략                              |
| `--skip-target-e2e` | L6 타겟 spec 생략 · visual smoke + L7 full만                    |
| `--skip-remote`     | `stack:push-remote` 생략 (토큰 없음)                            |
| `--manifest=<path>` | manifest 출력 경로 (기본 `gate-manifest/phase-r-manifest.json`) |

---

## L8 only (`check:full`)

Phase R 타겟/L7 이후 최종 확인 1회 또는 sql/e2e 단독 RC:

```powershell
bun run check:full
```

동일 schema manifest emit — 미실행 gate는 `skip` · executed gate `pass|fail`.

---

## Manifest schema (machine report)

```json
{
  "commit": "<full SHA>",
  "commitShort": "<7-char>",
  "branch": "<name>",
  "startedAt": "<ISO>",
  "finishedAt": "<ISO>",
  "totalDurationMs": 0,
  "releaseReady": true,
  "gates": {
    "typecheck": { "status": "pass", "durationMs": 0 },
    "lint": { "status": "pass", "durationMs": 0 },
    "sql": { "status": "pass", "durationMs": 0 },
    "advisor": { "status": "pass", "durationMs": 0 },
    "e2e": { "status": "pass", "durationMs": 0 },
    "visual": { "status": "pass", "durationMs": 0 },
    "pwa": { "status": "pass", "durationMs": 0 }
  }
}
```

- **CI:** `gate-manifest/` 를 workflow artifact로 upload (repo 커밋 금지).
- **스크린샷/로그:** `playwright-report/` · `test-results/` — CI artifact only.

---

## 출시 판정

- `releaseReady: true` + Phase R 전 gate `pass` = 에이전트 측 결함0 달성.
- P0/P1 잔존 = 출시 불가 (master plan Release Risk Matrix).
- Phase D operator 관문은 별도 — [`PHASE-D-GATE-RUNBOOK.md`](PHASE-D-GATE-RUNBOOK.md) (구 RELEASE_ROADMAP은 2026-07-04 삭제 — git history).
