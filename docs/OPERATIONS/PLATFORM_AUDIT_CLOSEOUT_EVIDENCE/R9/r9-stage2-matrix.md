# R9 Stage2 Browser Matrix — Remaining URL × 768/1024/2560

> **SHA:** `dcfd8c7e` · **Timestamp:** 2026-07-13T07:00–07:16+09:00  
> **Deferred:** `/sports/fixture/$fixtureId` · `/users/$userId/tier` (parameterized · E2E seed)

## Result summary

| Metric                                    |                                   Value |
| ----------------------------------------- | --------------------------------------: |
| States measured                           |                                 **366** |
| PASS (load + hard console 0 + overflow 0) |                                 **290** |
| FAIL                                      |                                  **76** |
| Confirmed product FAIL                    |                 **1** (`/install@2560`) |
| Harness flake (re-measure)                | **~50+** (`ERR_ABORTED` · eval context) |

## Batch A — Critical remeasure + marketing/auth web (30 URL)

| Result   | 113/114 PASS                                                                           |
| -------- | -------------------------------------------------------------------------------------- |
| **FAIL** | `web/install@2560x1440` — `useInstallPrompt must be used within InstallPromptProvider` |

## Batch B — Summary by segment

| Segment                                    | States | PASS | FAIL |
| ------------------------------------------ | -----: | ---: | ---: |
| earn + wallet (24 paths)                   |     72 |   40 |   32 |
| trade + sports + casino partial (12 paths) |     36 |   36 |    0 |
| games + account partial (12 paths)         |     36 |   26 |   10 |
| settings + notifications (9 paths)         |     27 |   17 |   10 |
| admin (27 paths)                           |     81 |   58 |   23 |

## Confirmed FAIL inventory

| URL        | Viewport  | Error                                       |
| ---------- | --------- | ------------------------------------------- |
| `/install` | 2560×1440 | `InstallPromptProvider` missing — pageerror |

## Harness flake (operator re-measure 또는 CI)

대표 패턴: `page.goto: net::ERR_ABORTED` · `Execution context was destroyed` — 동일 URL 재-run 시 PASS 다수. Release 판정에 **단독 사용 금지** · CI browser-matrix authoritative.

## Auth note

- Web/Admin protected routes: unauthenticated → `/login` = **PASS** (fail-closed load).
- Admin desk DOM assertions — R5 vitest + operator MFA 세션 (본 matrix는 load/console/overflow only).
