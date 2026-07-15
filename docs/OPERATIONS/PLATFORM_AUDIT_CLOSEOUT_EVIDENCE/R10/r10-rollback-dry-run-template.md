# R10 — Rollback Dry-Run (operator template)

> **Plan todo:** `audit-r10-rollout-soak`  
> **상태:** **TEMPLATE** — R10에서 1회 필수 ([`PLATFORM_DRILL_CALENDAR.md`](../../PLATFORM_DRILL_CALENDAR.md))  
> **Target:** Known Good SHA 복귀 ≤15분

## Drill metadata

| Field            | Value                       |
| ---------------- | --------------------------- |
| `drill_id`       | DRILL-ROLLBACK-R10-YYYYMMDD |
| `started_at`     |                             |
| `finished_at`    |                             |
| `duration_sec`   |                             |
| `known_good_sha` |                             |
| `result`         | PASS / FAIL                 |

## 15min checklist

| Step | Minutes | Action                                   | Done |
| ---: | ------- | ---------------------------------------- | ---- |
|    1 | 0–2     | Trigger 분류 (Money / UI / Security)     | [ ]  |
|    2 | 2–5     | Frontend Known Good SHA 재배포           | [ ]  |
|    3 | 5–7     | CDN purge · hard refresh                 | [ ]  |
|    4 | 7–10    | Backend migration rollback **금지** 확인 | [ ]  |
|    5 | 10–12   | Stage1 8-route smoke                     | [ ]  |
|    6 | 12–15   | Decision Log + Evidence URI              | [ ]  |

## Notes

_operator notes_

## Sign-off

```yaml
signed_by: { sre: '', product: '' }
evidence_uri: docs/OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R10/r10-rollback-dry-run-template.md
```
