# R5 Stage1 Browser — Admin safety smoke

> **Date:** 2026-07-13 · **Profile:** ui-route Stage1  
> **Note:** 저사양 · Admin preview 미기동 — **역할 negative = unit vitest** (`admin-nav-filter` · `admin-rbac`)로 Stage1 역할 증거를 대체. Browser MCP 전수 육안은 R9 전수 또는 operator preview 시 보강.

## Covered by unit (authoritative for this closeout)

| Check | Result |
| --- | --- |
| viewer hides withdrawals/team | PASS (`admin-nav-filter`) |
| finance keeps deposits · no team | PASS |
| owner sees team + mfa | PASS |
| earn settlement opens reason dialog before RPC | PASS (`admin-earn-page`) |
| user tier write UI when unlocked | PASS (`admin-user-tier-page`) |
| formatAdminMoney strips `.000000` | PASS |

## Operator optional Browser

```text
Admin preview → login AAL2 → viewer preview(DEV) → /withdrawals redirect /
owner → /earn → 승인 → reason dialog
```
