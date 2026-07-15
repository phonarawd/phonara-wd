# R9 Preflight + Implement — Browser Runtime Matrix (2026-07-13)

> **Plan todo:** `audit-r9-runtime-matrix` · **상태:** **Implement DONE** (evidence collected · Release green **아님**)  
> **Evidence:** [`r9-runtime-implement.md`](r9-runtime-implement.md) · Stage1 [`r9-stage1-matrix.md`](r9-stage1-matrix.md) · Stage2 [`r9-stage2-matrix.md`](r9-stage2-matrix.md)

## 선행 게이트 (R8 → R9)

| Check                                     | Result   | Evidence                                                        |
| ----------------------------------------- | -------- | --------------------------------------------------------------- |
| `bun run cursor:status`                   | **PASS** | orphan 0 · E2E ports free                                       |
| `bun run check:deploy-parity` (local)     | **PASS** | 4/4                                                             |
| `bun run check:deploy-parity -- --remote` | **PASS** | Web+Admin manifest `releaseSha=dcfd8c7e` · SHA parity · headers |
| Browser MCP preview                       | **PASS** | `project-0-phonara-gb-playwright`                               |
| Admin Pages                               | **PASS** | `phonara-admin` project · `preview.phonara-admin.pages.dev`     |

### Deploy notes (2026-07-13)

- Web preview: `wrangler pages deploy` → alias `preview.phonara-web.pages.dev`
- Admin: 신규 `phonara-admin` Pages project · main + preview branch deploy
- `deploy-pages.ts`: Pages deploy 시 `--config` 제거 (wrangler 4.x Pages 미지원)

## 산출물

| Artifact             | Path                                                                         | 상태      |
| -------------------- | ---------------------------------------------------------------------------- | --------- |
| URL matrix SOT (124) | [`PLATFORM_RUNTIME_URL_MATRIX.json`](../../PLATFORM_RUNTIME_URL_MATRIX.json) | **READY** |
| URL validator        | `bun run audit:runtime-urls`                                                 | **READY** |
| Stage1 matrix        | [`r9-stage1-matrix.md`](r9-stage1-matrix.md)                                 | **DONE**  |
| Stage2 matrix        | [`r9-stage2-matrix.md`](r9-stage2-matrix.md)                                 | **DONE**  |
| Implement closeout   | [`r9-runtime-implement.md`](r9-runtime-implement.md)                         | **DONE**  |

## Stage1 범위 (공식 매트릭스)

Critical 8 surface · viewport 390 · 580 · 1455 = **24 states**.

**판정:** 기능 **24/24 PASS** · strict (JS SLO 포함) **3/24 PASS** — Web `539kb` > `450kb` SLO.

## Stage2 범위

- Critical 8 remeasure × 768/1024/2560
- Remaining concrete URL (parameterized 2건 deferred)
- **366 states** measured · **290 PASS** · 확정 결함 `/install@2560`

## Release blockers (R10 전)

1. **R9-PERF-JS** — Web Stage1 initial JS SLO
2. **R9-INSTALL-CTX** — `/install` InstallPromptProvider
3. Stage2 harness flake — CI re-check
