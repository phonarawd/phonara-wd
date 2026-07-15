# R12 — PPR 72h Review (operator template)

> **Plan todo:** `audit-r12-post-release`  
> **Window:** 72h · **Due:** RC+72h (2026-07-16T09:00 KST)  
> **상태:** **TEMPLATE** — operator가 72h 창 종료 후 채움  
> **Authority:** [`PLATFORM_POST_RELEASE_REVIEW.md`](../../PLATFORM_POST_RELEASE_REVIEW.md) §47

## Window

| Field             | Value                                      |
| ----------------- | ------------------------------------------ |
| `review_id`       | PRR-72H-YYYYMMDD                           |
| `rc_sha`          | `dcfd8c7eab0374296ffeecdc5cd3f79433786ebe` |
| `window_start_at` | _ISO8601 KST_                              |
| `window_end_at`   | _ISO8601 KST_                              |

## Metrics (수치 필수)

| Metric                              | Value | Notes                    | OK  |
| ----------------------------------- | ----: | ------------------------ | --- |
| Provider timeout rate (15m peak)    |       | ≤ PLATFORM_SLO_SLA.yaml  | [ ] |
| Withdrawal queue max delay (min)    |       | ≤ withdraw_queue_max_min | [ ] |
| Deposit post max delay (min)        |       | ≤ deposit_post_max_min   | [ ] |
| Risk Register new High+ UNMITIGATED |       | 0                        | [ ] |
| Evidence retention spotcheck        |       | 90d path exists          | [ ] |
| Finding OPEN delta (72h)            |       | no new CRITICAL          | [ ] |

## Retention spotcheck

```text
Primary bucket: platform-audit-evidence
Index: docs/OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/
Template: R11/r11-evidence-retention-spotcheck.md
```

## Sign-off (operator)

```yaml
review_id: PRR-72H-YYYYMMDD
window: 72h
rc_sha: dcfd8c7eab0374296ffeecdc5cd3f79433786ebe
metrics:
  provider_timeout_rate_pct: 0
  withdrawal_queue_max_min: 0
  deposit_post_max_min: 0
  risk_high_unmitigated_delta: 0
result: PASS # PASS|FAIL
evidence_uri: docs/OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R12/r12-ppr-72h-template.md
signed_by:
  sre: { at: '' }
  wallet: { at: '' }
```
