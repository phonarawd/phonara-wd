# Admin ZIP Paste Manifest

> Phase 0 · `.lovable-intake/incoming/admin-earn-hub/` · 2026-06-19 · **§GREEN Final 2026-06-19** · **L2-W wire fix 2026-06-19**

## ZIP inventory (verified)

| Zone | Count | Target |
|------|-------|--------|
| `components/admin/*` | 54 | `apps/admin/src/components/admin/` |
| `hooks/admin/*` + `useAdminSportsMock.ts` | 11 | `apps/admin/src/hooks/` |
| `ImportedAdmin*Page` | 12 | `apps/admin/src/presentation-import/admin/pages/` |
| `components/ui/*` | shadcn set | `apps/admin/src/components/ui/` |
| `styles.css` | 1 | `presentation-import/styles/admin-globals.css` |
| Auth login/MFA page | **0** | legacy re-skin (`admin-auth-frame`) — §GREEN evidence |

## Route map (13 surfaces)

`/overview` · `/alerts` · `/queues` · `/audit` · `/operations` · `/users` · `/settings` · `/sports` · `/casino` · `/earn` · `/cms` · `/mfa/policy` + auth `/login` · `/mfa/enroll` · `/mfa/challenge`

## Wire status (Phase 7 — final)

| Tier | Surfaces | Hook / behavior |
|------|----------|-----------------|
| **A wired** | `/operations`, `/alerts`, `/audit`, `/queues` (withdraw + KYC/STR/risk), `/overview` | `useAdminOperations`, `useAdminAuditAlerts`, `useAdminWalletDesk`, `useAdminCompliance`, `useAdminOverview` — real RPC / ops health |
| **B wired** | `/sports`, `/earn` (settlements), `/queues` deposit recon | `useAdminSports`, `useAdminEarnDesk`, `useAdminWalletDesk` (`crypto_deposit_requests`, `rpc_admin_match_crypto_deposit`) |
| **C display + disabled mutations** | `/users`, `/casino`, `/cms`, `/settings` (access) | `useAdmin*Mock` **read-only seed**; mutation buttons `disabled` + `admin.wire.disabledNoRpc` — no fake success in production |
| **Auth** | login / MFA | legacy `admin-auth-frame` + routes (ZIP had no auth pages) |

## Legacy delete (Phase 4)

- `admin-layout.tsx`, `admin-page-header.tsx`, `features/queues/presentation.tsx` — **removed**, import 잔존 **0**
- Kept: `admin-auth-frame.tsx` (auth routes)

## E2E testids (preserved)

`overview-page` · `ops-health-refresh` · `ops-card-*` · `admin-sidebar` · `nav-*` · `admin-alerts-page` · `admin-queues-page` · `queue-kyc-approve-*` · `admin-withdrawals-table` · `queue-withdraw-reject-*` · `audit-page` · `audit-table` · `operations-page` · `ops-feature-game-toggle` · `ops-confirm-reason` · `ops-confirm-confirm` · `admin-login-form` · `admin-forbidden`

## §GREEN self-check (paste slice)

**FAIL =** `useAdminOverview` · `useAdminOperations`가 동일 `queryKey: ['ops-health']` 공유(형태 불일치) → SPA nav `/operations` blank.

**Fix (L2-W):** `['ops-health','overview']` · `['ops-health','desk']` · `operations-page` testid → page wrapper.

```powershell
rg "useAdmin.*Mock\(" apps/admin/src/components/admin --glob '!**/__tests__/**' --glob '!**/*Mock*'
# Expected: Tier C hubs only (CasinoDeskHub, CmsDeskHub, UsersDeskHub, Access*Hub)
rg "admin-layout|admin-page-header|features/queues/presentation" apps/admin
# Expected: 0 imports (styles.css class name only OK)
Set-Location apps/admin; bunx tsc -b
Set-Location ../..; bun run check:i18n; bun run check:release; bun run check:hygiene
bun run test:e2e -- tests/e2e/admin.spec.ts tests/e2e/admin-mfa.spec.ts
# 2026-06-19: admin.spec 8/8 (operations nav + feature toggle green)
```
