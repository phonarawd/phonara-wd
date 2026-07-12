# R2-a — Crypto/Giftcard Hub Fail-Closed Implement (`audit-r2a-crypto-giftcard`)

> **Stage:** R2-a · **Plan todo:** `audit-r2a-crypto-giftcard`  
> **Findings:** H-03 · H-11  
> **Date:** 2026-07-13  
> **Command:** Implement (fail-closed only · migration 0 · engine 0)  
> **Investigate:** [`r2-capability-rails-investigate.md`](r2-capability-rails-investigate.md)

## Findings touched

| Finding  | Fix summary                                                                                                       | Unit / contract gate                                         |
| -------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **H-03** | `cryptoRails=false` → deposit/withdraw/redeem hub omit crypto · route `beforeLoad` redirect · derive/submit block | wallet-capability-rails · deposit/withdraw hub · crypto-edge |
| **H-11** | giftcard market 0 → hub/redeem omit giftcard rails · direct deposit/redeem URL → hub `Navigate`                   | wallet-capability-rails · giftcard deposit/redeem pages      |

## Code owners

| Path                                                              | Role                                           |
| ----------------------------------------------------------------- | ---------------------------------------------- |
| `apps/web/src/domain/wallet-capability-rails-display-contract.ts` | capability predicates · redirect/block helpers |
| `apps/web/src/features/wallet/deposit-hub-display.ts`             | `resolveDepositHubRails`                       |
| `apps/web/src/features/wallet/withdraw-hub-display.ts`            | `resolveWithdrawHubRails`                      |
| `apps/web/src/domain/wallet-redeem-display-contract.ts`           | redeem rail filter (crypto + giftcard market)  |
| `apps/web/src/features/wallet/use-deposit-hub-controller.ts`      | fee market + LAUNCH_GATES wire                 |
| `apps/web/src/features/wallet/use-withdraw-hub-controller.ts`     | cryptoRails wire                               |
| `apps/web/src/features/wallet/use-wallet-redeem-controller.ts`    | market + cryptoRails wire                      |
| `apps/web/src/features/wallet/use-crypto-deposit.ts`              | derive/create invoke block                     |
| `apps/web/src/features/wallet/use-crypto-withdraw-controller.ts`  | withdraw invoke block                          |
| `apps/web/src/routes/wallet.deposit.crypto.tsx`                   | fail-closed redirect → `/wallet/deposit`       |
| `apps/web/src/routes/wallet.withdraw.crypto.tsx`                  | fail-closed redirect → `/wallet/withdraw`      |
| `apps/web/src/product/surfaces/wallet/giftcard-deposit-page.tsx`  | empty market → deposit hub                     |
| `apps/web/src/product/surfaces/wallet/giftcard-redeem-page.tsx`   | empty market → redeem hub                      |

## Gates (local L0–L4)

```text
bun run typecheck                         → green
bun run test -- <R2a owner paths>         → 56/56
```

Owner paths:

- `apps/web/src/domain/__tests__/wallet-capability-rails-display-contract.test.ts`
- `apps/web/src/domain/__tests__/wallet-redeem-display-contract.test.ts`
- `apps/web/src/domain/__tests__/crypto-edge-display-contract.test.ts`
- `apps/web/src/features/wallet/__tests__/deposit-hub-display.test.ts`
- `apps/web/src/features/wallet/__tests__/withdraw-hub-display.test.ts`
- `apps/web/src/product/surfaces/wallet/__tests__/deposit-hub-page.test.tsx`
- `apps/web/src/product/surfaces/wallet/__tests__/withdraw-hub-page.test.tsx`
- `apps/web/src/product/surfaces/wallet/__tests__/wallet-redeem-page.test.tsx`
- `apps/web/src/product/surfaces/wallet/__tests__/giftcard-deposit-page.test.tsx`
- `apps/web/src/product/surfaces/wallet/__tests__/giftcard-redeem-page.test.tsx`

## Runtime / Browser

| Item                      | Status                                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Stage1 Wallet Browser MCP | **PASS** — [`r2a-stage1-browser.md`](r2a-stage1-browser.md) · preview `19976b6e` / `preview.phonara-web.pages.dev` |

Finding status after Stage1: **VERIFIED_FIXED** (H-03 · H-11).

## No Shortcut checklist

- [x] Crypto rail not merely disabled — **omitted** from hubs while `cryptoRails=false`
- [x] Direct `/wallet/deposit/crypto` · `/wallet/withdraw/crypto` redirect before Edge/RPC
- [x] Derive invoke gated (`shouldBlockCryptoDepositInvoke`)
- [x] Giftcard rail omitted until `rpc_list_giftcard_fee_market` returns ≥1 row
- [x] Direct giftcard deposit/redeem URLs redirect to hubs when market empty
- [x] Migration 0 · engine 0 · `LAUNCH_GATES.cryptoRails` remains false (flip blocked until provider green)
