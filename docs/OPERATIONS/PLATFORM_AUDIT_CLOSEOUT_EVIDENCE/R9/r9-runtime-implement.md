# R9 — Runtime URL Matrix (`audit-r9-runtime-matrix`)

> **Plan todo:** `audit-r9-runtime-matrix` · **Finding:** M-18 (R9 일괄 Runtime)  
> **Date:** 2026-07-13 · **dod_profile:** ui-route · Browser MCP only  
> **Release SHA:** `dcfd8c7eab0374296ffeecdc5cd3f79433786ebe` · `gitDirty=false`

## 선행 게이트 (R8 → R9)

| Check                             | Result   | Evidence                                                            |
| --------------------------------- | -------- | ------------------------------------------------------------------- |
| `check:deploy-parity -- --remote` | **PASS** | Web+Admin manifest `releaseSha=dcfd8c7e` · lock parity · headers OK |
| `bun run audit:runtime-urls`      | **PASS** | 124 concrete URL (Web 95 · Admin 29)                                |
| Browser MCP preview               | **PASS** | `project-0-phonara-gb-playwright` · preview origins only (G5)       |
| Admin Pages project               | **PASS** | `phonara-admin` created · `preview.phonara-admin.pages.dev` alias   |

## Stage1 — Critical 8 × 390/580/1455 (24 states)

**판정:** **STAGE1_SLO_FAIL** — 기능 게이트 대부분 PASS · Web 초기 JS 예산 전면 초과

| Gate                          | Result         | Detail                                                         |
| ----------------------------- | -------------- | -------------------------------------------------------------- |
| Load / navigation             | **24/24 PASS** | Protected → `/login` fail-closed OK                            |
| Console/page hard error       | **24/24 PASS** | advisory: CSP inline · `exchange_rate_snapshots` 401           |
| overflow-x                    | **24/24 PASS** |                                                                |
| fixed overlap heuristic       | **24/24 PASS** |                                                                |
| LCP ≤ 3500ms                  | **24/24 PASS** | 456–1816ms measured                                            |
| initial JS ≤ 450kb            | **3/24 PASS**  | Web shell **539kb** (21 FAIL) · Admin login **402kb** (3 PASS) |
| **Strict matrix (all gates)** | **3/24 PASS**  | Admin Dashboard only                                           |

상세: [`r9-stage1-matrix.md`](r9-stage1-matrix.md)

## Stage2 — Remaining URL + 768/1024/2560

**판정:** **STAGE2_COLLECTED** — 전수 측정 완료 · Release green **아님**

| Batch                                                  |  States |    PASS |   FAIL | 비고                                                     |
| ------------------------------------------------------ | ------: | ------: | -----: | -------------------------------------------------------- |
| A — Critical remeasure + public/marketing web (30 URL) |     114 |     113 |      1 | FAIL: `web/install@2560` pageerror InstallPromptProvider |
| B — earn/wallet/trade/sports/casino/games/settings     |     171 |     119 |     52 | 일부 `net::ERR_ABORTED` harness flake (재측정 권고)      |
| B — admin (27 URL)                                     |      81 |      58 |     23 | unauth → `/login` load OK · flake 혼재                   |
| **합계**                                               | **366** | **290** | **76** | parameterized 2 URL deferred (fixture/user seed)         |

상세: [`r9-stage2-matrix.md`](r9-stage2-matrix.md)

## 확정 Runtime 결함 (Release Block 후보)

| ID                  | Severity | Symptom                                         | Root cause (evidence)                                                                               | Owner path                              |
| ------------------- | -------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **R9-PERF-JS**      | HIGH     | Stage1 Web 21/21 states `jsKb=539` > SLO 450    | SPA entry+i18n 번들 DCL 전 로드 과다                                                                | `apps/web` production chunk graph       |
| **R9-INSTALL-CTX**  | MEDIUM   | `web/install@2560` pageerror                    | `InstallPage` calls `useInstallPrompt` outside `InstallPromptProvider` on wide viewport render path | `install-page.tsx` · shell wiring       |
| **R9-STAGE2-FLAKE** | LOW      | sporadic `ERR_ABORTED` / eval context destroyed | MCP long-run navigation race (8GB)                                                                  | harness — CI E2E authoritative re-check |

## R9 Exit vs Release Gate

| Criterion                          | Status                                                 |
| ---------------------------------- | ------------------------------------------------------ |
| Evidence collected (Stage1+2)      | **YES**                                                |
| `UNVERIFIED` 0 for measured states | **YES** (366/366 attempted · 2 parameterized deferred) |
| Stage1+2 all green                 | **NO** — JS SLO · `/install` · flake                   |
| R10 착수                           | **BLOCKED** until PERF-JS + INSTALL-CTX triage         |

## Gates (Implemented)

```text
bun run check:deploy-parity -- --remote → 9/9 PASS
bun run audit:runtime-urls → 124/124
bun run test -- tests/scripts/runtime-url-matrix.test.ts → 2/2
Browser MCP Stage1 24 states + Stage2 366 states (preview SHA dcfd8c7e)
```

## Next

1. **R9-PERF-JS** — code-split / i18n lazy-load → redeploy → Stage1 JS re-measure
2. **R9-INSTALL-CTX** — wrap `/install` route with `PwaShell`/`InstallPromptProvider`
3. Stage2 flake rows — targeted MCP re-run 또는 CI `e2e-browser-matrix`
4. Green 후 **`audit-r10-rollout-soak`**
