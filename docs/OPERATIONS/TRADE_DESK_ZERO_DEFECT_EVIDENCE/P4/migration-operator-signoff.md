# P4-D — Operator migration signoff (서면 승인)

> **Todo:** `p4-migration-verify` · Gate 2 **operator-signoff**  
> **Status:** `[ ]` template — **migration touch 시에만** 작성  
> **무효:** 채팅/이메일/구두 승인 · migration 파일명 누락

---

## Scope (fill on approval)

| Field                   | Value                                                                                                                |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Migration file(s)       | `supabase/migrations/___________________________`                                                                    |
| Trigger tier            | P1-C / P4 / operator RED STOP / other: **\_\_**                                                                      |
| Impossibility ref       | [`migration-verify-ladder.md`](migration-verify-ladder.md) rationale                                                 |
| security-auditor review | [`migration-security-auditor-review.md`](migration-security-auditor-review.md) — must be PASS **before** local apply |

## Operator sign-off

```text
Date: __________
I confirm UI-only paths are insufficient and this migration is unavoidable.
I authorize local db reset → test:sql → stack:push-remote per P4-D ladder.
Migration filename(s): ___________________________
Verdict: APPROVED / REJECTED
Signature / Initials: ____
```

## Implemented

```text
N/A until migration touch — template only (P4-D impl 2026-07-08)
```

## Verified

```text
Pending: actual migration touch + ladder step 6 stack:push-remote CI advisors green
```
