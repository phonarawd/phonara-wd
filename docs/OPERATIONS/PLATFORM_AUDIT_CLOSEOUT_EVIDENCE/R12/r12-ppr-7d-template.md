# R12 — PPR 7d Review (operator template)

> **Plan todo:** `audit-r12-post-release`  
> **Window:** 7d · **Due:** RC+7d (2026-07-20T09:00 KST)  
> **상태:** **TEMPLATE** — operator가 7d 창 종료 후 채움  
> **Authority:** [`PLATFORM_POST_RELEASE_REVIEW.md`](../../PLATFORM_POST_RELEASE_REVIEW.md) §47 · §48 Freeze lift

## Window

| Field             | Value                                      |
| ----------------- | ------------------------------------------ |
| `review_id`       | PRR-7D-YYYYMMDD                            |
| `rc_sha`          | `dcfd8c7eab0374296ffeecdc5cd3f79433786ebe` |
| `window_start_at` | _ISO8601 KST_                              |
| `window_end_at`   | _ISO8601 KST_                              |

## 7d rollup (수치 필수)

| Metric                   | Value |               Threshold | OK  |
| ------------------------ | ----: | ----------------------: | --- |
| 7d trigger fires total   |       |      0 or ACCEPTED Risk | [ ] |
| 7d SLO violations        |       |             0 or waiver | [ ] |
| 7d Money Delta alarms    |       |                       0 | [ ] |
| 7d Incidents P0/P1       |       |                       0 | [ ] |
| Soak 24h snapshot        |       |          PASS or waiver | [ ] |
| DR drill status          |       | scheduled / not overdue | [ ] |
| Secrets rotation overdue |       |                       0 | [ ] |
| KPI OPEN Findings        |       |       per KPI dashboard | [ ] |

## DR / Incident lessons

| Item              | Status | Next due   |
| ----------------- | ------ | ---------- |
| Rollback drill    |        | 2026-08-13 |
| DR drill          | never  | 2026-10-13 |
| Incident tabletop | never  | 2026-10-13 |

## Freeze lift recommendation (Product Owner A only)

```yaml
freeze_lift_recommendation: hold # hold|lift_partial|lift_full
rationale: ''
blockers_remaining:
  - R9-PERF-JS # if still OPEN
  - three-owner-signoff # if still pending
signed_by:
  product: { at: '', decision: '' }
  sre: { at: '' }
```

## Sign-off (operator)

```yaml
review_id: PRR-7D-YYYYMMDD
window: 7d
rc_sha: dcfd8c7eab0374296ffeecdc5cd3f79433786ebe
result: PASS # PASS|FAIL — FAIL = Freeze 유지 · Incident + Rollback 검토
evidence_uri: docs/OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R12/r12-ppr-7d-template.md
signed_by:
  product: { at: '' }
  sre: { at: '' }
```

**7d PASS 후에만** Product Owner(A)가 Freeze 완화·다음 Finding Stage 재개를 결정한다.
