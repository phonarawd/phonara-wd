# R10 — 24h Soak Snapshot (operator template)

> **Plan todo:** `audit-r10-rollout-soak`  
> **상태:** **TEMPLATE** — operator가 24h 창 종료 후 채움  
> **SOP:** [`PLATFORM_R10_ROLLOUT_SOAK.md`](../../PLATFORM_R10_ROLLOUT_SOAK.md) §4

## Window

| Field            | Value              |
| ---------------- | ------------------ |
| `soak_start_at`  | _ISO8601 KST_      |
| `soak_end_at`    | _ISO8601 KST_      |
| `known_good_sha` | _40-hex_           |
| `deployment_id`  | _Pages ID or null_ |

## Checkpoint results

| Checkpoint           | Time (KST) | Result      | Notes                       |
| -------------------- | ---------- | ----------- | --------------------------- |
| pre-deploy-30m       |            | PASS / FAIL | dry-fire 6/6 · parity       |
| post-deploy-smoke-5m |            | PASS / FAIL | 8-route smoke               |
| post-deploy-60m      |            | PASS / FAIL | spotcheck SQL WARNING count |
| snapshot-24h         |            | PASS / FAIL | 본 문서                     |

## Trigger / SLO (24h)

| Metric                         | Value |   Threshold | OK  |
| ------------------------------ | ----: | ----------: | --- |
| Rollback trigger fires         |     0 |           0 | [ ] |
| Money Delta alarms             |     0 |           0 | [ ] |
| ops_alerts critical open (end) |       |           0 | [ ] |
| SLO violations (recorded)      |       | 0 or waiver | [ ] |

## Spotcheck command

```powershell
psql $env:DATABASE_URL -f scripts/platform-r10-rollout-spotcheck.sql
```

## Sign-off (operator)

```yaml
signed_by: { sre: '', product: '' }
result: PASS # PASS|FAIL|WAIVED
waiver_ids: [] # e.g. R9-PERF-JS if baseline only
evidence_uri: docs/OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R10/r10-soak-24h-snapshot.md
```
