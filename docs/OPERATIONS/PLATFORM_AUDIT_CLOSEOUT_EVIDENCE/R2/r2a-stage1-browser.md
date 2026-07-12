# R2-a — Stage1 Browser Verify (H-03 · H-11)

> **Date:** 2026-07-13  
> **Intent:** Wallet hub fail-closed after `audit-r2a-crypto-giftcard` Implement  
> **Result:** pending deploy + Browser MCP (this file updated after probe)

## Gate outcome (fill after probe)

| Check | Result | Evidence |
| ----- | ------ | -------- |
| Preview redeploy of R2-a build | pending | |
| `/wallet/deposit/crypto` does not stay on crypto route (`cryptoRails=false`) | pending | redirect → deposit hub or login |
| `/wallet/withdraw/crypto` does not stay on crypto route | pending | redirect → withdraw hub or login |
| Deposit hub omits crypto rail (auth path) | unit + optional Browser | vitest deposit-hub-page |
| Giftcard empty market redirect | unit | giftcard-deposit/redeem page tests |

## Decision

Unit/typecheck green. Stage1 Browser probe follows preview deploy.
