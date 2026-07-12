# R1 — Stage1 Browser Verify (C-01 / C-02 / H-01 / M-01)

> **Date:** 2026-07-13T02:35:00+09:00  
> **Intent SHA (code):** `391646f6` · **Docs SHA:** `b466e8fc`  
> **Preview deploy:** `bun run deploy:pages:web:preview` → alias `https://preview.phonara-web.pages.dev` · deployment `https://949b87ec.phonara-web.pages.dev`  
> **Result:** **`STAGE1_PASS`** — Finding **VERIFIED_FIXED** 후보 (DOM matrix PASS)

## Gate outcome

| Check                                        | Result       | Evidence                                                                                                               |
| -------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Preview redeploy of R1 build                 | **PASS**     | wrangler Pages deploy complete                                                                                         |
| Browser MCP `/` · `/status`                  | **PASS**     | Playwright MCP                                                                                                         |
| Viewport matrix 390 · 580 · 1455             | **PASS**     | MCP `browser_run_code` matrix below                                                                                    |
| C-01 fail-closed (no synthetic social proof) | **PASS**     | no `누적 가입자` / withdrawal proof / testimonials                                                                     |
| H-01 omit stale 1:1 FX                       | **PASS**     | no `1 PHON = 1 KRW` · no `≈ ₩`                                                                                         |
| M-01 `PHON` unit                             | **PASS**     | `+200 PHON` / `+500 PHON` (no `+NP`)                                                                                   |
| Brand title                                  | **PASS**     | `PHONARA — 부업 습관` (no PrimeForge)                                                                                  |
| C-02 `/status` never false-green             | **PASS**     | `확인 중` · copy denies “정상” without live feed                                                                       |
| App JS crash 0                               | **PASS**     | no route-breaking JS errors                                                                                            |
| Console noise                                | **ADVISORY** | Cloudflare Insights CSP block · `exchange_rate_snapshots` **401** (H-01 omit path) — not synthetic-proof / false-green |

## Matrix (post-deploy)

| Viewport | Landing fail-closed | `+N PHON` | `/status` `확인 중` | false-green |
| -------- | ------------------- | --------- | ------------------- | ----------- |
| 390×844  | PASS                | PASS      | PASS                | none        |
| 580×844  | PASS                | PASS      | PASS                | none        |
| 1455×900 | PASS                | PASS      | PASS                | none        |

## Prior probe (pre-redeploy)

`PREVIEW_SHA_MISMATCH` — live still had synthetic stats / `+P` / 1:1 FX / title PrimeForge. Unblocked by preview deploy above.

## Decision

Stage1 Browser **PASS** → registry C-01 / C-02 / H-01 / M-01 → **`VERIFIED_FIXED`**.  
NEXT Implement: **`audit-r2-capability-rails`** (H-03 + H-11).  
CI: quality format fix pushed; **sql job was already red on pre-R1 SHA** — separate triage (not R1 landing scope).
