# R3-b — Service-write GRANT · Trigger/Helper Revoke (`audit-r3b-service-write-grants`)

> **Stage:** R3-b · **Plan todo:** `audit-r3b-service-write-grants`  
> **Finding:** M-06  
> **Date:** 2026-07-13  
> **Command:** Implement (migration 1 · RED-first SQL · `stack:push-remote` · advisor 0)

## Finding touched

| Finding  | Fix summary                                                                                                      | Gate |
| -------- | ---------------------------------------------------------------------------------------------------------------- | ---- |
| **M-06** | Client DML allowlist pin · trigger EXECUTE revoke · postgres DEFAULT PRIVILEGES no longer auto-grant client ALL | SQL + advisor |

## Root cause / fix

| 필드 | 값 |
| ---- | --- |
| **Root cause** | `public` schema DEFAULT PRIVILEGES가 신규 table/function에 anon·authenticated ALL/EXECUTE를 자동 부여 · E4 `_earn_vip_preserve_prime_elite` 등 trigger가 REVOKE 없이 PostgREST 호출 가능 |
| **Fix** | migration `20260815000001_m06_r3b_service_write_grants` — client write allowlist 재고정 · 전 trigger EXECUTE revoke · postgres DEFAULT PRIVILEGES 최소화 |
| **Ledger** | money path 변경 0 (GRANT/REVOKE + default privileges only) |
| **Note** | hosted Supabase에서 `ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin`는 42501 — migration postgres가 강제 가능한 postgres defaults만 고정 |

## Code owners

| Path | Role |
| ---- | ---- |
| `supabase/migrations/20260815000001_m06_r3b_service_write_grants.sql` | M-06 lockdown |
| `supabase/tests/m06_r3b_service_write_grants_test.sql` | RED-first owner |
| `supabase/tests/grants_rls_inventory_test.sql` | inventory pin (TRIGGER/REFERENCES + defacl) |

## Gates

```text
RED probe (pre-apply): auth_earn_vip=t · auth_set_updated=t · table_defacl_client_write=t · function_defacl_client_exec=t
bun run check:migrations → OK (233)
bun run stack:push-remote → OK · remote name …_m06_r3b_service_write_grants
bun run check:advisors → 0 ERROR
remote privilege probe (MCP) → auth_earn_vip=f · auth_set_updated=f · trigger_client_leaks=0 · postgres defacl client write/exec=f · allowlist profiles/push OK · svc live_crash INSERT=t
```

## Remote privilege probe (2026-07-13)

| Check | Result |
| ----- | ------ |
| authenticated EXECUTE `_earn_vip_preserve_prime_elite` | false |
| authenticated EXECUTE `set_updated_at` | false |
| trigger funcs with client EXECUTE | 0 |
| authenticated INSERT `wallets` / `live_crash_rounds` | false |
| authenticated UPDATE `profiles` | true (allowlist) |
| authenticated INSERT `push_subscriptions` | true (allowlist) |
| service_role INSERT `live_crash_rounds` | true |
| postgres table DEFAULT PRIVILEGES client write | false |
| postgres function DEFAULT PRIVILEGES client EXECUTE | false |

## No Shortcut checklist

- [x] Client DML base GRANT = allowlist only (`profiles` UPDATE · `push_subscriptions` CRUD)
- [x] Trigger/helper client EXECUTE 0
- [x] postgres DEFAULT PRIVILEGES recurrence control
- [x] Migration 1 tranche · rewrite 없음
- [x] RED-first SQL owner · inventory pin
- [x] `stack:push-remote` · advisor 0 ERROR
- [x] GRANT만 약화해 테스트 통과시키지 않음 (실측 revoke + remote probe)

Finding status: **VERIFIED_FIXED** (M-06 · Backend/DB profile).

NEXT Implement: ~~`audit-r3c-search-path-sweep`~~ → **`audit-r3d-siwe-analytics-ingress`** (M-04).
