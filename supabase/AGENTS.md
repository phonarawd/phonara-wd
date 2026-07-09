# supabase — Database Agents

> **Engine:** `[x] FULLY CLOSED` — status [`ENGINE_APEX_CLOSEOUT.md`](../docs/ENGINE_APEX_CLOSEOUT.md) only · **신규 migration/RPC 금지** (operator RED STOP 예외)  
> **Active SSOT:** [`ACTIVE_WORK_SSOT.md`](../docs/SSOT/ACTIVE_WORK_SSOT.md)

## Scope

- Migrations (`supabase/migrations/`), RLS, GRANT/REVOKE, `rpc_*` functions, SQL tests
- Single project: `yocjhjsdwoijfdrehzoq` — stop if any other ref appears

## Migration discipline (regression / operator 승인 시만)

1. Draft SQL → local `supabase db reset` → `bun run test:sql` (Σ=0 + hash-chain)
2. Update `grants_rls_inventory_test.sql` when GRANT/RLS changes
3. Remote apply: **`bun run stack:push-remote`** only
4. Remote advisor **0 ERROR** before done

## PL/pgSQL (25-postgres-plpgsql)

- No SAVEPOINT in function bodies; use nested BEGIN/EXCEPTION
- `SECURITY DEFINER` + `SET search_path = public, pg_temp` in header
- Revoke internal helpers from `anon`/`authenticated`
- Client `rpc_*` must guard `auth.uid()` / `_is_admin()`

## Never

- Retro-edit remotely applied migrations — new file instead
- `INSERT` into `profiles`/`wallets` in tests — `auth.users` trigger creates them
- RAISE after side effects that must persist (use return status)
- Phase evidence reports as work queue — 감사 이력만 (`DEPRECATED_DOC_DENYLIST`)

## Gates

```bash
bun run test:sql          # 103/103
bun run stack:push-remote
bun run check:advisors    # 0 ERROR
```

## Edge Functions

P0 edge — migration 적용 후 deploy. Operator: `bun run stack:verify-worldno1-edge` · `stack:smoke-pg-webhook-hmac`

| 함수                        | `verify_jwt`      |
| --------------------------- | ----------------- |
| `notification-dispatch`     | `true`            |
| `ops-notify`                | `true`            |
| `crypto-withdraw-broadcast` | `true`            |
| `pg-bank-webhook`           | `false` (PG HMAC) |
