# R1 — Stage1 Browser Verify (C-01 / C-02 / H-01 / M-01)

> **Date:** 2026-07-13T02:20:00+09:00  
> **Intent SHA (code):** `391646f6`  
> **Preview URL:** `https://preview.phonara-web.pages.dev`  
> **Result:** **`PREVIEW_SHA_MISMATCH`** — Finding **VERIFYING 유지** · `VERIFIED_FIXED` **불가**

## Gate outcome

| Check                              | Result                 | Evidence                                                         |
| ---------------------------------- | ---------------------- | ---------------------------------------------------------------- |
| Browser MCP navigate `/`           | PASS                   | Playwright MCP `browser_navigate`                                |
| Browser MCP navigate `/status`     | PASS                   | Playwright MCP `browser_navigate`                                |
| Viewport 390×844                   | PASS (resize)          | MCP `browser_resize`                                             |
| Deployed build == `391646f6`       | **FAIL**               | Live DOM still pre-R1 (below)                                    |
| Console error 0 on `/` · `/status` | **FAIL** (1 CSP error) | Cloudflare Insights inline script blocked by CSP — not R1 defect |
| C-01 fail-closed on live preview   | **FAIL**               | Synthetic cumulative stats still rendered                        |
| H-01 omit stale 1:1 FX             | **FAIL**               | `1 PHON = 1 KRW` + `≈ ₩2,900` still shown                        |
| M-01 `PHON` unit (not `P`)         | **FAIL**               | Teasers still `+200P` / `+500P`                                  |
| C-02 `/status` never false-green   | **N/A on R1 build**    | Live `/status` is pre-R1 stub copy (no settled/정상 badge)       |
| 580 · 1455 matrix                  | **DEFERRED**           | Blocked until preview redeploy of intent SHA                     |

## Live DOM probe (2026-07-13 · MCP `browser_evaluate`)

**`/`**

| Signal                            | Observed                                                                      |
| --------------------------------- | ----------------------------------------------------------------------------- |
| `document.title` (post-hydration) | `PrimeForge — 부업 습관`                                                      |
| Body brand string                 | `PHONARA` present · `PrimeForge` absent in body                               |
| Synthetic stats                   | **present** — `누적 가입자` / `1,061,398명` / `156,800,000 PHON` / `52,400건` |
| Wallet preview FX                 | **present** — `≈ ₩2,900` · `1 PHON = 1 KRW (표시용)`                          |
| Reward unit                       | **`+200P` / `+500P` / `+2,000P`** (not `+N PHON`)                             |
| Withdrawal proof / testimonials   | **present**                                                                   |

**`/status`**

| Signal                         | Observed                                                              |
| ------------------------------ | --------------------------------------------------------------------- |
| Title                          | `시스템 상태`                                                         |
| Body                           | Stub: `장애·점검 공개 상태 페이지는 이후 엔진 웨이브에서 제공됩니다.` |
| False-green `정상` / `settled` | **not observed** on this stub                                         |

## Artifact note

- `stage1-landing-390.png` in this folder previously matched **R0** `probe5-preview-landing-390.png` byte-for-byte (SHA256 `F5F33D22…`) — **not** a valid R1 Stage1 capture. Treat as **INVALID until replaced** after preview redeploy.
- MCP screenshot files land outside the workspace roots (`phonara-playwright-mcp` TEMP sandbox) — operator/agent must copy or redeploy-then-recapture into this folder.

## Unblock (required before `VERIFIED_FIXED`)

1. `bun run deploy:pages:web:preview` on SHA ≥ `391646f6` (+ format-fix commit if needed)
2. Re-probe `/` · `/status` at **390 · 580 · 1455**
3. Assert: synthetic stats **hidden** · 1:1 FX footnote **absent** · rewards `+N PHON` · `/status` badges `pending` / unknown (never settled/정상)
4. Save fresh PNGs + update Finding registry → `VERIFIED_FIXED` · ACTIVE_WORK R1 **DONE**

## Decision

R1 Implement code gates (vitest/typecheck/i18n) remain green locally.  
**Stage1 Browser closeout = blocked on preview deploy**, not on missing Implement work.
