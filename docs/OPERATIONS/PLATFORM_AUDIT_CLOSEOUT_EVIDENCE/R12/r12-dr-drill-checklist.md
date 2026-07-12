# R12 — DR Drill Checklist (operator)

> **Plan todo:** `audit-r12-post-release`  
> **Drill type:** DR (분기 1회) · **Next due:** 2026-10-13  
> **Authority:** [`PLATFORM_DRILL_CALENDAR.md`](../../PLATFORM_DRILL_CALENDAR.md) §51

## Pre-flight

| Check                                     | OK  |
| ----------------------------------------- | --- |
| Incident Response doc current             | [ ] |
| RPO/RTO targets documented                | [ ] |
| Backup restore path verified (local dump) | [ ] |
| Security + SRE owners assigned            | [ ] |
| Evidence bucket writable                  | [ ] |

## Execution steps

1. **Scenario brief** — P0 data loss / region unavailable tabletop (15m)
2. **Backup restore** — Supabase local dump restore drill (document duration)
3. **RPO/RTO measure** — record actual vs target
4. **Failover tabletop** — decision log entries (if applicable)
5. **Post-drill** — update [`PLATFORM_DRILL_CALENDAR.md`](../../PLATFORM_DRILL_CALENDAR.md) last success

## Record template

```yaml
drill_id: DRILL-DR-2026-10-13
type: dr
started_at: ''
finished_at: ''
duration_sec: 0
rpo_target_min: 0
rpo_actual_min: 0
rto_target_min: 0
rto_actual_min: 0
result: PASS # PASS|FAIL
notes: ''
evidence_uri: ''
signed_by:
  sre: { at: '' }
  security: { at: '' }
```

## R12 confirmation (Implement)

| Drill             | Next due   | Status at R12 Implement |
| ----------------- | ---------- | ----------------------- |
| Rollback          | 2026-08-13 | scheduled               |
| DR                | 2026-10-13 | never · not overdue     |
| Incident tabletop | 2026-10-13 | never · not overdue     |

미실시·**기한 초과** = Release Gate Block. 2026-07-13 기준 DR은 **scheduled** (Gate Block 아님).
