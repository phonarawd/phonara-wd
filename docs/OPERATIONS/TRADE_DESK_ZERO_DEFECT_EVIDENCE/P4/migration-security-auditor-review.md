# P4-D — security-auditor pre-review (migration touch)

> **Todo:** `p4-migration-verify` · Gate 3 **security-auditor**  
> **Status:** `[ ]` template — **local db reset 전** readonly review 필수  
> **도구:** `security-auditor` subagent · readonly · migration/RPC/RLS/GRANT scope

---

## Review scope (fill before apply)

| Item                  | Value                                                                       |
| --------------------- | --------------------------------------------------------------------------- |
| Migration file(s)     | `supabase/migrations/___________________________`                           |
| Operator signoff      | [`migration-operator-signoff.md`](migration-operator-signoff.md) — APPROVED |
| RLS/GRANT delta       | YES / NO — if YES, `grants_rls_inventory_test.sql` update required          |
| Money path touch      | YES / NO — if YES, conservation_test branch pin required                    |
| SECURITY DEFINER RPCs | list: `___` (fill before apply)                                             |

## Auditor checklist

| #   | Check                                                   | PASS / FAIL | Notes |
| --- | ------------------------------------------------------- | ----------- | ----- |
| 1   | No unguarded `rpc_*` exposed to anon/authenticated      |             |       |
| 2   | Internal helpers REVOKED from PUBLIC/anon/authenticated |             |       |
| 3   | RLS + GRANT paired in same migration                    |             |       |
| 4   | No retro-edit of remotely applied migration             |             |       |
| 5   | Forward-fix only if rollback needed (no down migration) |             |       |
| 6   | Single project lock `yocjhjsdwoijfdrehzoq`              |             |       |

## Auditor verdict

```text
Date: __________
Reviewer: security-auditor (readonly)
Verdict: PASS / FAIL
Blocking findings: ___________________________
Re-review required: YES / NO
```

> **FAIL =** local `db reset` · `stack:push-remote` **금지** until remediated.

## Implemented

```text
N/A until migration touch — template only (P4-D impl 2026-07-08)
```

## Verified

```text
Pending: migration touch → auditor PASS row → CI sql + advisors green after stack:push-remote
```
