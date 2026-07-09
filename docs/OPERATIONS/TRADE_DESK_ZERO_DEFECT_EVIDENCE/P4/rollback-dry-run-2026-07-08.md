# P4-C — Rollback dry-run snapshot

> **Todo:** `p4-release-rollback` · Plan `trade_desk_qa_audit` P4-C  
> **Status:** `[x]` impl 2026-07-08 · operator 15min dry-run Verified pending

---

## Scope

| Item                     | Value                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| Operator doc             | [`TRADE_DESK_RELEASE_ROLLBACK_RUNBOOK.md`](../../TRADE_DESK_RELEASE_ROLLBACK_RUNBOOK.md) |
| Contract                 | `apps/web/src/domain/trade-desk-release-rollback-display-contract.ts`                    |
| Compatibility rows       | 5 (SUPPORTED · SKEW-RISK ×2 · SUPPORTED compat · UNSUPPORTED)                            |
| Rollback checklist steps | 6 (15min)                                                                                |
| Rollback triggers        | 4+ (Money · Σ · advisor · soak)                                                          |
| Cache note               | 1 (CDN · browser · PWA N/A)                                                              |

## DoD checklist (P4-C)

| 항목                     | Gate                              | 상태                  |
| ------------------------ | --------------------------------- | --------------------- |
| Release/rollback runbook | operator doc 한국어               | `[x]` impl 2026-07-08 |
| Compatibility matrix 5행 | contract + runbook §Compatibility | `[x]` impl 2026-07-08 |
| Cache note 1줄           | v5 V4 CDN/browser skew            | `[x]` impl 2026-07-08 |
| 15min rollback checklist | 6 steps                           | `[x]` impl 2026-07-08 |
| E0 P4 slot               | 본 파일                           | `[x]` impl 2026-07-08 |
| Operator dry-run 서명    | 실제 15min 수행                   | `[ ]` pending         |

## 15min rollback dry-run (operator — fill on drill)

| #   | Step                                | Done  | notes           |
| --- | ----------------------------------- | ----- | --------------- |
| 1   | Trigger 분류 drill (Money vs UI)    | `[ ]` |                 |
| 2   | Frontend previous SHA 식별          | `[ ]` | deploy log      |
| 3   | CDN purge / hard refresh 확인       | `[ ]` | cache note      |
| 4   | forward-fix only 확인 (no DB down)  | `[ ]` | UNSUPPORTED row |
| 5   | trade-desk-smoke mental walkthrough | `[ ]` |                 |
| 6   | E0 incident template 경로 확인      | `[ ]` | ops-window      |

**Operator sign-off:**

```text
Date: __________
Duration: ___ min (target ≤15)
Verdict: dry-run PASS / FAIL
Initials: ____
```

## Implemented

```text
gate:ai-impl --test apps/web/src/domain/__tests__/trade-desk-release-rollback-display-contract.test.ts green
```

## Verified

```text
Pending: git push → GitHub Actions quality green
Pending: operator rollback dry-run 서명 (본 표)
Linked: L9/release-approval-record.md §Release deploy log (ae94979 · 2026-07-08)
```
