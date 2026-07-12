# R1 — Trust & Truth Implement Evidence (`audit-r1-trust-truth`)

> **Stage:** R1 · **Plan todo:** `audit-r1-trust-truth`  
> **Date:** 2026-07-13  
> **Command:** Implement (C-01 · C-02 · H-01 · M-01 · PrimeForge→PHONARA)  
> **Baseline SHA:** `9c4bf29b40d31b2d2952bd6257f5690d691ecbc2`

## Findings touched

| Finding | Fix summary | Unit / contract gate |
| --- | --- | --- |
| **C-01** | `resolveLandingProof` fail-closed — stats/testimonials/withdrawalProof/ambientSocial default `hidden` | landing-display-contract · landing-page |
| **H-01** | Wallet preview = `MoneyDisplay` + `useEarnFiatHint` · omit KRW when missing/stale · remove 1:1 footnote UI | landing-wallet-preview · landing-page |
| **M-01** | Landing teasers `+N PHON` via `formatLandingRewardPhonLabel` | landing-display-contract · landing-page |
| **C-02** | `/status` badges `pending` + unknown copy · never `settled`/`정상` | system-status-page · contract |
| **Brand** | `PLATFORM_PRODUCT_NAME=PHONARA` · pageTitle/i18n/meta | platform-narrative · i18n |

## Gates (local L0–L4)

```text
bun run typecheck                         → green
bun run check:i18n                        → green
bun run test -- <R1 owner paths>          → 26/26
```

Owner paths:

- `apps/web/src/domain/__tests__/landing-display-contract.test.ts`
- `apps/web/src/domain/__tests__/system-status-display-contract.test.ts`
- `apps/web/src/domain/__tests__/platform-narrative-display-contract.test.ts`
- `apps/web/src/product/surfaces/landing/__tests__/landing-page.test.tsx`
- `apps/web/src/product/surfaces/marketing/__tests__/system-status-page.test.tsx`

## Runtime / Browser

| Item | Status |
| --- | --- |
| Stage1 `/` · `/status` Browser MCP | **pending** — capture after feature-branch preview SHA deploy |
| Preview SHA parity | pending push |

Finding status after this evidence: **VERIFYING** (not CLOSED / not VERIFIED_FIXED until Stage1 Browser).

## No Shortcut checklist

- [x] Ambient presentation stats not re-labeled as “예시” — sections **omitted**
- [x] No invented 1 PHON = 1 KRW
- [x] Landing reward labels not bare `P`
- [x] Status never shows operational without live health RPC (R4)
- [x] Migration 0 · engine 0
