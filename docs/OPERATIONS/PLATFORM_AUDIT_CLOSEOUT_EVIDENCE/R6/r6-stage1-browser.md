# R6 Stage1 Browser — Product consistency smoke

> **Date:** 2026-07-13 · **Profile:** ui-route Stage1  
> **Note:** 저사양 · Web preview 미기동 — **unit vitest가 Stage1 행동 증거**. Browser MCP 전수 육안은 R9 또는 operator preview 시 보강.

## Covered by unit (authoritative for this closeout)

| Check | Result |
| --- | --- |
| Spot base qty fail-closed / Decimal precision | PASS (`spot-base-quantity-display-contract`) |
| Settings inbox hidden when `notificationsCenter=false` · prefs kept | PASS (`settings-hub-display-contract`) |
| Fold4 mission card is Link to `/home/missions` | PASS (`earn-home-page`) |
| Casino subnav has no `/casino/tournaments` | PASS (`subnav-route-manifest` · `p10-gate`) |
| Price alert shows local-only note | PASS (`trade-price-alert-control`) |
| Cross margin disabled + entry TP/SL limit/stop off | PASS (`r6-trade-capability-honesty`) |
| Onboarding matches Earn tab | PASS (`shell-route-matchers`) |
| PWA banner uses bottomnav CSS var | PASS (source assert · typecheck) |

## Operator optional Browser

```text
preview → /home Fold4 mission card → /home/missions
/settings — inbox link absent while gate false; /settings/notifications present
/trade — price alert dialog local-only · futures cross disabled reason
/casino — subnav lobby+fairness only
390/580 — PWA banner above BottomNav (no overlap)
```
