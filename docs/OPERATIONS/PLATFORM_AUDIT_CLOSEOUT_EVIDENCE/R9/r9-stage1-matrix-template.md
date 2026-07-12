# R9 Stage1 Browser Matrix — Critical 8 (template)

> **Plan todo:** `audit-r9-runtime-matrix`  
> **Fill during Implement** — preflight에서 빈 템플릿만 생성  
> **SOT:** [`PLATFORM_RUNTIME_URL_MATRIX.json`](../../PLATFORM_RUNTIME_URL_MATRIX.json)

## Metadata (Evidence Integrity §22)

| Field             | Value                                     |
| ----------------- | ----------------------------------------- |
| finding_id        | M-18 (R9 일괄 Runtime)                    |
| preview_web       | `https://preview.phonara-web.pages.dev`   |
| preview_admin     | `https://preview.phonara-admin.pages.dev` |
| release_sha_web   | _TBD — remote manifest_                   |
| release_sha_admin | _TBD — remote manifest_                   |
| timestamp         | _TBD_                                     |
| pr                | _TBD_                                     |
| mcp_server        | `project-0-phonara-gb-playwright`         |
| launcher          | `scripts/playwright-mcp-8gb.json`         |

## Result summary

| Gate                                      | Result         |
| ----------------------------------------- | -------------- |
| Stage1 Critical 8 × 3 viewports           | _PENDING_ / 24 |
| Console/page error 0                      | _PENDING_      |
| axe critical+serious 0                    | _PENDING_      |
| overflow/fixed overlap 0                  | _PENDING_      |
| touch 48px / interactive 44px             | _PENDING_      |
| LCP ≤ `stage1_lcp_max_ms` (3500)          | _PENDING_      |
| initial JS ≤ `stage1_initial_js_kb` (450) | _PENDING_      |

## Matrix

각 행: surface · viewport · origin+path · PASS/FAIL · console · axe · overflow · overlap · notes · screenshot URI (bucket, repo 커밋 금지)

| Surface         | VP       | URL       | Load | Console | axe | overflow | overlap | touch | LCP | JS kb | Result | Notes                        |
| --------------- | -------- | --------- | ---- | ------- | --- | -------- | ------- | ----- | --- | ----- | ------ | ---------------------------- |
| Landing         | 390×844  | /         |      |         |     |          |         |       |     |       |        |                              |
| Landing         | 580×844  | /         |      |         |     |          |         |       |     |       |        |                              |
| Landing         | 1455×900 | /         |      |         |     |          |         |       |     |       |        |                              |
| Home            | 390×844  | /home     |      |         |     |          |         |       |     |       |        |                              |
| Home            | 580×844  | /home     |      |         |     |          |         |       |     |       |        |                              |
| Home            | 1455×900 | /home     |      |         |     |          |         |       |     |       |        |                              |
| Wallet          | 390×844  | /wallet   |      |         |     |          |         |       |     |       |        |                              |
| Wallet          | 580×844  | /wallet   |      |         |     |          |         |       |     |       |        |                              |
| Wallet          | 1455×900 | /wallet   |      |         |     |          |         |       |     |       |        |                              |
| Trade           | 390×844  | /trade    |      |         |     |          |         |       |     |       |        |                              |
| Trade           | 580×844  | /trade    |      |         |     |          |         |       |     |       |        |                              |
| Trade           | 1455×900 | /trade    |      |         |     |          |         |       |     |       |        |                              |
| Sports          | 390×844  | /sports   |      |         |     |          |         |       |     |       |        |                              |
| Sports          | 580×844  | /sports   |      |         |     |          |         |       |     |       |        |                              |
| Sports          | 1455×900 | /sports   |      |         |     |          |         |       |     |       |        |                              |
| Casino          | 390×844  | /casino   |      |         |     |          |         |       |     |       |        |                              |
| Casino          | 580×844  | /casino   |      |         |     |          |         |       |     |       |        |                              |
| Casino          | 1455×900 | /casino   |      |         |     |          |         |       |     |       |        |                              |
| Admin Dashboard | 390×844  | admin `/` |      |         |     |          |         |       |     |       |        | MFA session 필요 시 operator |
| Admin Dashboard | 580×844  | admin `/` |      |         |     |          |         |       |     |       |        |                              |
| Admin Dashboard | 1455×900 | admin `/` |      |         |     |          |         |       |     |       |        |                              |
| Settings        | 390×844  | /settings |      |         |     |          |         |       |     |       |        |                              |
| Settings        | 580×844  | /settings |      |         |     |          |         |       |     |       |        |                              |
| Settings        | 1455×900 | /settings |      |         |     |          |         |       |     |       |        |                              |

## Auth note

- Web protected routes: unauthenticated → `/login` redirect = **PASS** (fail-closed) unless route requires authenticated DOM assertions.
- Admin `/`: unauthenticated → `/login` = **PASS** for Stage1 load gate; role-negative는 R5 vitest + Stage2 MFA 세션.

## Stage2 gate

Stage1 **24/24 PASS** 후에만:

- Remaining Web+Admin URLs ([`audit:runtime-urls`](../../../package.json))
- Viewports 768 · 1024 · 2560
- Parameterized `/sports/fixture/$fixtureId` · `/users/$userId/tier` (E2E seed)
