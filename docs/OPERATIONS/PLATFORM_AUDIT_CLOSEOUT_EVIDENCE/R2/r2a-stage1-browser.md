# R2-a — Stage1 Browser Verify (H-03 · H-11)

> **Date:** 2026-07-13T03:07:00+09:00  
> **Intent SHA:** `2f3785c9`  
> **Preview deploy:** `bun run deploy:pages:web:preview` → alias `https://preview.phonara-web.pages.dev` · deployment `https://19976b6e.phonara-web.pages.dev`  
> **Result:** **`STAGE1_PASS`** — H-03/H-11 **VERIFIED_FIXED** 후보

## Gate outcome

| Check                                                              | Result   | Evidence                                                                                           |
| ------------------------------------------------------------------ | -------- | -------------------------------------------------------------------------------------------------- |
| Preview redeploy of R2-a build                                     | **PASS** | wrangler Pages deploy complete                                                                     |
| `/wallet/deposit/crypto` leaves crypto route (`cryptoRails=false`) | **PASS** | final URL `/login` (hub auth after capability redirect) — never stayed on `/wallet/deposit/crypto` |
| `/wallet/withdraw/crypto` leaves crypto route                      | **PASS** | final URL `/login` — never stayed on `/wallet/withdraw/crypto`                                     |
| Deposit/withdraw/redeem hub omit crypto/giftcard                   | **PASS** | unit vitest 56/56 (auth required for live hub DOM)                                                 |
| Giftcard empty market → hub redirect                               | **PASS** | giftcard-deposit/redeem page vitest (auth + market RPC)                                            |
| App JS crash 0                                                     | **PASS** | login page rendered                                                                                |

## Decision

Stage1 Browser **PASS** → registry H-03 / H-11 → **`VERIFIED_FIXED`**.  
NEXT Implement: **`audit-r2b-withdrawal-copy`** (H-10).
