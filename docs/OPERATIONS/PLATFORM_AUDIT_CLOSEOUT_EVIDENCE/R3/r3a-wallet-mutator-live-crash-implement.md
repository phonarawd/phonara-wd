# R3-a — Wallet Mutator · Live Crash Secret (`audit-r3a-wallet-mutator-live-crash`)

> **Stage:** R3-a · **Plan todo:** `audit-r3a-wallet-mutator-live-crash`  
> **Finding:** H-02  
> **Date:** 2026-07-13  
> **Command:** Implement (migration 1 · RED-first SQL · `stack:push-remote` · advisor 0)

## Finding touched

| Finding  | Fix summary                                                                                          | Gate          |
| -------- | ---------------------------------------------------------------------------------------------------- | ------------- |
| **H-02** | `rpc_lock_wallet` client EXECUTE revoke · `live_crash_rounds` RPC-only · `server_seed` column closed | SQL + advisor |

## Root cause / fix

| 필드           | 값                                                                                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Root cause** | `20260701000001_phon_bonus_real_wagering`가 P0 lockdown 이후 `rpc_lock_wallet`을 authenticated에 재GRANT · live crash는 table SELECT + open RLS로 secret 열 방어가 약함 |
| **Fix**        | migration `20260814000001_h02_r3a_wallet_mutator_live_crash` — client EXECUTE revoke · rounds SELECT revoke · open policy drop · bets/tier_admin SELECT-only pin        |
| **Ledger**     | money path 변경 0 (GRANT/REVOKE only) · 기존 withdrawal SECURITY DEFINER → `_lock_wallet_internal` / owner 호출 유지                                                    |

## Code owners

| Path                                                                       | Role                                 |
| -------------------------------------------------------------------------- | ------------------------------------ |
| `supabase/migrations/20260814000001_h02_r3a_wallet_mutator_live_crash.sql` | H-02 lockdown                        |
| `supabase/tests/h02_r3a_wallet_mutator_live_crash_test.sql`                | RED-first owner                      |
| `supabase/tests/grants_rls_inventory_test.sql`                             | inventory pin                        |
| `supabase/tests/ew_e23_casino_live_test.sql`                               | E23-0 secret/SELECT                  |
| `supabase/tests/anon_lockdown_test.sql`                                    | Test 1e lock revoke                  |
| `scripts/check-wallet-mutator-privileges.ts`                               | final-state mutator check            |
| `supabase/config.toml`                                                     | Hyper-V excluded-port dodge (54600+) |

## Gates

```text
bun run check:wallet-mutators → OK (final state)
bun run check:migrations → OK (232)
local: h02_r3a + grants_rls_inventory + anon_lockdown Test 1e → green
bun run stack:push-remote → OK · remote tail …_h02_r3a_wallet_mutator_live_crash
bun run check:advisors → 0 ERROR
remote privilege probe (MCP execute_sql) → auth_lock=f · auth_lcr_sel=f · auth_seed=f · svc_lock=t
```

## Remote privilege probe (2026-07-13)

| Check                                         | Result |
| --------------------------------------------- | ------ |
| authenticated EXECUTE `rpc_lock_wallet`       | false  |
| anon EXECUTE `rpc_lock_wallet`                | false  |
| service_role EXECUTE `rpc_lock_wallet`        | true   |
| authenticated/anon SELECT `live_crash_rounds` | false  |
| authenticated SELECT `server_seed`            | false  |
| authenticated TRUNCATE `live_crash_bets`      | false  |

## No Shortcut checklist

- [x] Client generic wallet mutator EXECUTE 0
- [x] Live crash secret column read 0 (direct)
- [x] Direct `live_crash_rounds` SELECT 0 (RPC `rpc_live_crash_get_current` only)
- [x] Migration 1 tranche · rewrite 없음
- [x] RED-first SQL owner · inventory · anon_lockdown
- [x] `stack:push-remote` · advisor 0 ERROR
- [x] GRANT만 약화해 테스트 통과시키지 않음 (실제 revoke + remote probe)

Finding status: **VERIFIED_FIXED** (H-02 · Backend/DB profile).

NEXT Implement: **`audit-r3b-service-write-grants`** (M-06).
