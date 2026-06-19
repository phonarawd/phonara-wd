# Admin ZIP Wire Feasibility Audit

> Phase 0B · 2026-06-19 · ZIP: `Earn Hub Redesign.zip` → `apps/admin`  
> **APPROVE:** paste + wire EXECUTE GO (operator standing autonomy)

## Tier A — 100% wire (legacy parity)

| Surface | Read | Write | Legacy source |
|---------|------|-------|---------------|
| `/login` | session | signIn | `routes/login.tsx` |
| `/mfa/*` | admin-auth | MFA enroll/verify | `domain/admin-auth.ts` |
| `/overview` | ops health RPC | refresh | `domain/ops.ts` |
| `/alerts` | ops alerts RPC | ack/resolve/sync | `routes/alerts.tsx` |
| `/queues` | wallet/compliance tables | queue RPCs | `routes/queues.tsx` + `domain/queues.ts` |
| `/audit` | audit_logs | read-only | `use-audit-logs.ts` |
| `/operations` | app_config | set_system_mode, set_feature_enabled | `routes/operations.tsx` |

## Tier B — WIRE-RPC (engine exists)

| Desk | RPC / table |
|------|-------------|
| Sports | `rpc_admin_list_unsettled_sports_fixtures`, `rpc_admin_suspend_sports_market`, `rpc_admin_list_sports_exposure`, … |
| Casino void | `rpc_admin_void_game_bet` |
| Earn | `affiliate_settlements` read, `rpc_approve_affiliate_commission`, `rpc_run_affiliate_settlements` |
| Wallet deposit | `rpc_admin_match_crypto_deposit` |
| Compliance RG | `rpc_admin_release_self_exclusion` |

## Tier C — DISABLED-NO-RPC

CMS write · RBAC mutation · casino RTP/catalog write · earn agent-tree mock actions · user ban/suspend

## E2E testid contract

`overview-page` · `admin-sidebar` · `nav-audit` · `nav-alerts` · `nav-queues` · `nav-operations` · `admin-alerts-page` · `admin-queues-page` · `operations-page` · `audit-page` · `admin-forbidden` · `admin-login-form` · `ops-feature-game-toggle` · `ops-confirm-reason` · `ops-confirm-confirm`

## Types sync note

Sports `rpc_admin_list_*` in migrations; extend `packages/shared-types` before sports wire.
