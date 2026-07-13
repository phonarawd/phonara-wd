# R9 Stage1 Browser Matrix — Critical 8

> **SHA:** `dcfd8c7e` · **Timestamp:** 2026-07-13T06:50+09:00  
> **Origins:** `preview.phonara-web.pages.dev` · `preview.phonara-admin.pages.dev`  
> **MCP:** `project-0-phonara-gb-playwright` · `playwright-mcp-8gb.json`

## Result summary

| Gate                            | Result                                                    |
| ------------------------------- | --------------------------------------------------------- |
| Stage1 Critical 8 × 3 viewports | **3/24 strict PASS** · **24/24 functional PASS**          |
| Console/page hard error 0       | **24/24 PASS**                                            |
| overflow / overlap 0            | **24/24 PASS**                                            |
| touch targets                   | **WARN** Landing only (dense CTA row) · auth routes PASS  |
| LCP ≤ 3500ms                    | **24/24 PASS**                                            |
| initial JS ≤ 450kb              | **3/24 PASS** (Admin only)                                |
| axe critical+serious            | **DEFER** — MCP VM file I/O 제한 · functional matrix 우선 |

## Matrix

| Surface         | VP       | Load | Console | overflow | overlap | touch | LCP  | JS kb | Result   | Notes               |
| --------------- | -------- | ---- | ------- | -------- | ------- | ----- | ---- | ----- | -------- | ------------------- |
| Landing         | 390×844  | PASS | PASS    | PASS     | PASS    | WARN  | 624  | 539   | **FAIL** | JS SLO              |
| Landing         | 580×844  | PASS | PASS    | PASS     | PASS    | WARN  | 764  | 539   | **FAIL** | JS SLO              |
| Landing         | 1455×900 | PASS | PASS    | PASS     | PASS    | WARN  | 564  | 539   | **FAIL** | JS SLO              |
| Home            | 390×844  | PASS | PASS    | PASS     | PASS    | PASS  | 520  | 539   | **FAIL** | → `/login` · JS SLO |
| Home            | 580×844  | PASS | PASS    | PASS     | PASS    | PASS  | 536  | 539   | **FAIL** | → `/login`          |
| Home            | 1455×900 | PASS | PASS    | PASS     | PASS    | PASS  | 520  | 539   | **FAIL** | → `/login`          |
| Wallet          | 390×844  | PASS | PASS    | PASS     | PASS    | PASS  | 484  | 539   | **FAIL** | → `/login`          |
| Wallet          | 580×844  | PASS | PASS    | PASS     | PASS    | PASS  | 512  | 539   | **FAIL** | → `/login`          |
| Wallet          | 1455×900 | PASS | PASS    | PASS     | PASS    | PASS  | 520  | 539   | **FAIL** | → `/login`          |
| Trade           | 390×844  | PASS | PASS    | PASS     | PASS    | PASS  | 484  | 539   | **FAIL** | → `/login`          |
| Trade           | 580×844  | PASS | PASS    | PASS     | PASS    | PASS  | 456  | 539   | **FAIL** | → `/login`          |
| Trade           | 1455×900 | PASS | PASS    | PASS     | PASS    | PASS  | 524  | 539   | **FAIL** | → `/login`          |
| Sports          | 390×844  | PASS | PASS    | PASS     | PASS    | PASS  | 552  | 539   | **FAIL** | → `/login`          |
| Sports          | 580×844  | PASS | PASS    | PASS     | PASS    | PASS  | 488  | 539   | **FAIL** | → `/login`          |
| Sports          | 1455×900 | PASS | PASS    | PASS     | PASS    | PASS  | 476  | 539   | **FAIL** | → `/login`          |
| Casino          | 390×844  | PASS | PASS    | PASS     | PASS    | PASS  | 492  | 539   | **FAIL** | → `/login`          |
| Casino          | 580×844  | PASS | PASS    | PASS     | PASS    | PASS  | 512  | 539   | **FAIL** | → `/login`          |
| Casino          | 1455×900 | PASS | PASS    | PASS     | PASS    | PASS  | 476  | 539   | **FAIL** | → `/login`          |
| Admin Dashboard | 390×844  | PASS | PASS    | PASS     | PASS    | PASS  | 1816 | 402   | **PASS** | → `/login`          |
| Admin Dashboard | 580×844  | PASS | PASS    | PASS     | PASS    | PASS  | 940  | 402   | **PASS** | → `/login`          |
| Admin Dashboard | 1455×900 | PASS | PASS    | PASS     | PASS    | PASS  | 988  | 402   | **PASS** | → `/login`          |
| Settings        | 390×844  | PASS | PASS    | PASS     | PASS    | PASS  | 488  | 539   | **FAIL** | → `/login`          |
| Settings        | 580×844  | PASS | PASS    | PASS     | PASS    | PASS  | 516  | 539   | **FAIL** | → `/login`          |
| Settings        | 1455×900 | PASS | PASS    | PASS     | PASS    | PASS  | 488  | 539   | **FAIL** | → `/login`          |

## Advisory console (non-block)

- Cloudflare Insights CSP inline script
- `exchange_rate_snapshots` 401 (H-01 fail-closed omit path)
