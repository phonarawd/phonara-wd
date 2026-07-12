# R2-b — Withdrawal OFF Copy · Decision · 5조건 (`audit-r2b-withdrawal-copy`)

> **Stage:** R2-b · **Plan todo:** `audit-r2b-withdrawal-copy`  
> **Finding:** H-10  
> **Date:** 2026-07-13  
> **Command:** Implement (copy + ops decision · migration 0 · engine 0 · flag flip 0)  
> **Investigate:** [`r2-capability-rails-investigate.md`](r2-capability-rails-investigate.md) (H-10 요약)

## Finding touched

| Finding  | Fix summary                                                                                                      | Unit / contract gate                          |
| -------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **H-10** | OFF = 운영 의도(Decision Log) · 사유/다음 행동 i18n · Feature Flag 5조건 재개 문서 · `feature_withdrawal_enabled` 유지 false | wallet-withdrawal-off · withdraw-hub vitest |

## Root cause / fix

| 필드 | 값 |
| ---- | --- |
| **Root cause** | Soft launch / T1 `feature_withdrawal_enabled=false` (의도) — 감사 시 “결함 vs 운영” 미문서화 |
| **Fix** | DL-R2B-H10 · `PLATFORM_WITHDRAWAL_REENABLE_GATE.md` · display contract + hub next-action CTA |
| **Not done** | flag ON · 신규 withdrawal RPC — R10 + 5조건 Green 전 **금지** |

## Code / docs owners

| Path | Role |
| ---- | ---- |
| `apps/web/src/domain/wallet-withdrawal-off-display-contract.ts` | paused banner keys · nextHref |
| `apps/web/src/product/surfaces/wallet/withdraw-hub-page.tsx` | reason + next-action CTA |
| `packages/i18n/src/index.ts` | ko/en unavailable* keys |
| `docs/OPERATIONS/PLATFORM_WITHDRAWAL_REENABLE_GATE.md` | Feature Flag 5조건 + W1–W7 |
| `docs/OPERATIONS/PLATFORM_AUDIT_DECISION_LOG.md` | DL-R2B-H10 |

## Gates (local L0–L4)

```text
bun run typecheck                         → green
bun run check:i18n                        → green
bun run test -- <R2b owner paths>         → 9/9
```

Owner paths:

- `apps/web/src/domain/__tests__/wallet-withdrawal-off-display-contract.test.ts`
- `apps/web/src/product/surfaces/wallet/__tests__/withdraw-hub-page.test.tsx`

## Runtime / Browser

| Item | Status |
| ---- | ------ |
| Stage1 `/wallet/withdraw` Browser MCP | **PASS** — [`r2b-stage1-browser.md`](r2b-stage1-browser.md) · preview → `/login` (auth) · copy via vitest |

Finding status after Stage1: **VERIFIED_FIXED** (H-10).

## No Shortcut checklist

- [x] OFF 사유 Decision Log 기록 (코드 결함으로 오판 금지)
- [x] 사용자 노출 사유 + 다음 행동 i18n
- [x] Feature Flag 5조건 재개 체크리스트 문서화
- [x] `feature_withdrawal_enabled` flip **0** (R10까지)
- [x] Migration 0 · engine 0
- [x] owner vitest 9/9 · typecheck · check:i18n
- [x] Browser Stage1 route evidence
