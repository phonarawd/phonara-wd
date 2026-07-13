# R6 — Product Consistency (`audit-r6-product-consistency`)

> **Stage:** R6 · **Plan todo:** `audit-r6-product-consistency`  
> **Findings:** M-03 · M-07 · M-08 · M-09 · M-10 · M-11 · M-19  
> **Date:** 2026-07-13  
> **Command:** Implement per PLATFORM_AUDIT_TODO_HANDOFF.md

## Finding touched

| Finding  | Fix summary                                                                                                                    | Gate                        |
| -------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------- |
| **M-03** | spot base qty → `formatSpotBaseQuantityDisplay` (Decimal · market/`_fmt6` precision) · unknown → `—` · USDT `formatMoney` 제거 | spot-base-quantity vitest   |
| **M-07** | Settings hub inbox `/notifications` → `resolveNotificationsCenterVisible` · prefs `/settings/notifications` 유지               | settings-hub vitest         |
| **M-08** | Fold4 mission card → `Link` to controller `route` (keyboard/focus)                                                             | earn-home-page vitest       |
| **M-09** | `CASINO_SUBNAV` tournaments row 삭제 · i18n key 유지 · route 미생성                                                            | subnav-route-manifest       |
| **M-10** | price alert local-only 고지 (`notif.priceAlert.localOnly`) · 서버 persistence 0                                                | trade-price-alert vitest    |
| **M-11** | entryTpSlOnOpenOrders=false · cross disabled reason 유지 · honesty vitest                                                      | r6-trade-capability-honesty |
| **M-19** | PWA banner bottom → `var(--ds-shell-bottomnav-height)+safe-area`                                                               | typecheck · shell token     |

## Root cause / fix

| 필드                  | 값                                                    |
| --------------------- | ----------------------------------------------------- |
| **Root cause (M-03)** | 비지갑 base를 `formatMoney(..., 'USDT')`로 포맷       |
| **Fix (M-03)**        | domain formatter + wire `quantityPrecision`           |
| **Root cause (M-07)** | Settings nav가 notificationsCenter gate 미적용        |
| **Fix (M-07)**        | TopBar/Account와 동일 resolver                        |
| **Root cause (M-08)** | mission `route`가 UI에 미연결                         |
| **Fix (M-08)**        | card 전체 Link                                        |
| **Root cause (M-09)** | subnav registry에 dead tournaments target             |
| **Fix (M-09)**        | row 삭제 only                                         |
| **Root cause (M-10)** | local store인데 고지 부재                             |
| **Fix (M-10)**        | localOnly copy                                        |
| **Root cause (M-11)** | disabled capability와 기대 불일치 risk                |
| **Fix (M-11)**        | disabled reason 유지 · 활성화 0                       |
| **Root cause (M-19)** | `4.5rem` 고정 offset                                  |
| **Fix (M-19)**        | bottomnav CSS variable                                |
| **Extra**             | `/onboarding` → Earn surface matcher (BottomNav Earn) |

## Code owners

| Path                                                                       | Role            |
| -------------------------------------------------------------------------- | --------------- |
| `apps/web/src/domain/spot-base-quantity-display-contract.ts`               | M-03            |
| `apps/web/src/product/surfaces/trade/spot-*.tsx` · `use-spot-desk-wire.ts` | M-03            |
| `apps/web/src/domain/settings-hub-display-contract.ts`                     | M-07            |
| `apps/web/src/product/surfaces/home/earn-home-page.tsx`                    | M-08            |
| `apps/web/src/product/shell/casino-subnav.ts`                              | M-09            |
| `apps/web/src/product/surfaces/trade/trade-price-alert-control.tsx` · i18n | M-10            |
| `apps/web/src/domain/__tests__/r6-trade-capability-honesty.test.ts`        | M-11            |
| `apps/web/src/product/shell/pwa-install-banner.tsx`                        | M-19            |
| `apps/web/src/product/shell/shell-route-matchers.ts`                       | onboarding Earn |

## Gates

```text
gate:ai-impl L0~L4 green · vitest 40/40 (owner suite)
check:i18n · check:release · typecheck green
```

## No Shortcut checklist

- [x] USDT formatter on non-wallet base **0**
- [x] Settings inbox gate = TopBar gate
- [x] Fold4 mission clickable Link
- [x] `/casino/tournaments` subnav row **0** · route not created · i18n key kept
- [x] price alert local-only disclosed · server RPC **0**
- [x] cross / entry TP·SL remain disabled with reason
- [x] PWA banner uses `--ds-shell-bottomnav-height`

Finding status: **M-03 / M-07 / M-08 / M-09 / M-10 / M-11 / M-19 → VERIFIED_FIXED**

NEXT Implement: **`audit-r7-type-ui-hygiene`**.
