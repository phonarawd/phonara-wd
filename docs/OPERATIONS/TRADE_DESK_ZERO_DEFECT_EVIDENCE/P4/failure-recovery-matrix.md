# P4-A — Failure recovery matrix snapshot

> **Todo:** `p4-failure-recovery` · Plan `trade_desk_qa_audit` P4-A  
> **Status:** `[x]` impl 2026-07-08 · operator freeze dry-run Verified pending

---

## Scope

| Item              | Value                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------- |
| Operator doc      | [`TRADE_DESK_FAILURE_RECOVERY_MATRIX.md`](../../TRADE_DESK_FAILURE_RECOVERY_MATRIX.md) |
| T0 cross-ref      | [`TRADE_DESK_T0_ORACLE_OPS_RUNBOOK.md`](../../TRADE_DESK_T0_ORACLE_OPS_RUNBOOK.md) §7  |
| Contract          | `apps/web/src/domain/trade-desk-failure-recovery-display-contract.ts`                  |
| Tier 1 rows       | 5 (basic visible recovery)                                                             |
| Tier 2 rows       | 7 (chaos + freeze + Redis N/A)                                                         |
| Freeze escalation | 4 steps (담당 · SLA · 확인 · 액션)                                                     |
| Freeze threshold  | 60s unchanged mark · oracle not stale                                                  |

## DoD checklist (P4-A)

| 항목                   | Gate                                | 상태                  |
| ---------------------- | ----------------------------------- | --------------------- |
| Tier1 Visible+recovery | matrix 5행 + P0 surfaces            | `[x]` impl 2026-07-08 |
| Tier2 ≥4 + freeze row  | matrix + `resolveOraclePriceFrozen` | `[x]` impl 2026-07-08 |
| Freeze escalation 4행  | operator 표 + T0 §7                 | `[x]` impl 2026-07-08 |
| E0 P4 slot             | 본 파일                             | `[x]` impl 2026-07-08 |

## Implemented

```text
gate:ai-impl --test apps/web/src/domain/__tests__/trade-desk-failure-recovery-display-contract.test.ts green
```

## Operator follow-up (선택)

| Action                      | When                                  |
| --------------------------- | ------------------------------------- |
| Freeze vs lag 분류 drill    | 배포 후 1회 · T0 §2.1 SQL + UI banner |
| `P4/incident-YYYY-MM-DD.md` | 실제 freeze incident 발생 시          |

## Verified

```text
Pending: git push → GitHub Actions quality green
Optional: operator freeze classification dry-run (15min SLA path)
```
