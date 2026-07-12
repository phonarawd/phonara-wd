# R2-d — KRW Proof Upload Wire (`audit-r2d-krw-proof-wire`)

> **Stage:** R2-d · **Plan todo:** `audit-r2d-krw-proof-wire`  
> **Finding:** M-21  
> **Date:** 2026-07-13  
> **Command:** Implement (migration 0 · engine 0 · UI wire + gate flip)

## Finding touched

| Finding  | Fix summary                                                                                                      | Unit / contract gate                          |
| -------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **M-21** | `/wallet/deposit/krw` proof upload · storage owner path · `rpc_attach_krw_deposit_proof` · pending · ledger 0 · `krwDepositProofLive=true` | krw-deposit-proof · page · E10 WAVE sync |

## Root cause / fix

| 필드 | 값 |
| ---- | --- |
| **Root cause** | E10 WAVE가 attach RPC를 live로 둔 채 Web caller·UI gate를 false로 분리 |
| **Fix** | display contract + storage upload + typed attach RPC + success-surface UI · gate flip |
| **Ledger** | attach **원장 이동 0** (credit = match RPC only) · Admin review 기존 `/admin/deposits` |

## Code owners

| Path | Role |
| ---- | ---- |
| `apps/web/src/domain/krw-deposit-proof-display-contract.ts` | path/mime · attach predicates · gate pin |
| `apps/web/src/domain/krw-deposit-proof-storage.ts` | `krw-deposit-proofs` upload |
| `apps/web/src/domain/wallet.ts` | `attachKrwDepositProof` typed RPC |
| `apps/web/src/features/wallet/use-krw-deposit-controller.ts` | validate→upload→attach |
| `apps/web/src/product/surfaces/wallet/krw-deposit-page.tsx` | proof upload card |
| `apps/web/src/lib/launch-gates.ts` | `krwDepositProofLive=true` |
| `apps/web/src/domain/ew-e10-platform-engine-display-contract.ts` | WAVE assert → M-21 unlocked |

## Gates (local L0–L4)

```text
bun run gate:ai-impl -- --test <R2d owner paths>  → green · vitest 24/24
```

Owner paths:

- `apps/web/src/domain/__tests__/krw-deposit-proof-display-contract.test.ts`
- `apps/web/src/domain/__tests__/ew-e10-platform-engine-display-contract.test.ts`
- `apps/web/src/product/surfaces/wallet/__tests__/krw-deposit-page.test.tsx`
- `apps/web/src/features/wallet/__tests__/krw-deposit-display.test.ts`
- `apps/web/src/features/wallet/__tests__/krw-deposit-page-display.test.ts`

## Runtime / Browser

| Item | Status |
| ---- | ------ |
| Stage1 `/wallet/deposit/krw` Browser MCP | see [`r2d-stage1-browser.md`](r2d-stage1-browser.md) |

Finding status after Stage1: **VERIFIED_FIXED** (M-21).

## No Shortcut checklist

- [x] File validation (JPG/PNG/WebP · ≤5MB) before storage
- [x] Owner path `{user_id}/proof.(jpg|jpeg|png|webp)`
- [x] Typed `rpc_attach_krw_deposit_proof` only (pending deposit)
- [x] Ledger credit 0 notice in UI
- [x] `krwDepositProofLive` flipped **with** wire (not orphan gate)
- [x] Migration 0 · engine remigration 0
- [x] owner vitest 24/24 · gate:ai-impl L0~L4
