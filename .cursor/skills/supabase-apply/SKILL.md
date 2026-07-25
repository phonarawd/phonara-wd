---
name: supabase-apply
description: Apply PHONARA Supabase migrations safely — local db reset, SQL tests, stack:push-remote, advisor 0. Use for any migration/RPC/RLS/GRANT work.
---

# PHONARA Supabase Apply Runbook

Single project lock: **`yocjhjsdwoijfdrehzoq`**

## Workflow

1. **Draft** migration in `supabase/migrations/` (new file — never retro-edit remotely applied)
2. **Pair** RLS changes with GRANT/REVOKE in same migration
3. **Update** `supabase/tests/grants_rls_inventory_test.sql` when privileges change
4. **Local apply:**

```powershell
supabase db reset
bun run test:sql
```

1. **Remote apply (canonical — hooks deny alternatives):**

```powershell
bun run stack:push-remote
```

1. **Advisor:**

```powershell
bun run check:advisors
```

Remote must show **0 ERROR** before done.

## Blocked paths (hooks enforce)

- `supabase db push`
- MCP `apply_migration`, `deploy_edge_function`
- Operator manual `supabase link` + push

## SQL test requirements (money paths)

- Exercise changed RPC branch
- Assert Σ=0 conservation per currency
- Hash-chain integrity where applicable
- `ROLLBACK` — no test residue

Reference: `.cursor/rules/20-supabase-safety.mdc` · `96-prod-apply-agent-deny.mdc` · `25-postgres-plpgsql.mdc`
