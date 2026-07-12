# Platform Drill Calendar (§51)

> **날짜:** 2026-07-13 · Playbook 1.0.0  
> 미실시·기한 초과 = Release Gate Block.

## 주기

| Drill             | 주기         | 내용                                                     | Evidence       |
| ----------------- | ------------ | -------------------------------------------------------- | -------------- |
| Rollback Drill    | **월 1회**   | Known Good SHA 5분 복귀 · Manifest/Flag/Migration        | URI + duration |
| DR Drill          | **분기 1회** | RPO/RTO · Backup restore (로컬 dump) · failover tabletop | URI + result   |
| Incident tabletop | **분기 1회** | P0 walkthrough (§42)                                     | 참석·결정 기록 |

## 캘린더 (R0 고정 · 다음 일정)

| Drill             | 다음 예정  | Owner              | 최근 성공            | Evidence URI |
| ----------------- | ---------- | ------------------ | -------------------- | ------------ |
| Rollback Drill    | 2026-08-13 | sre                | — (R10에서 1회 필수) | —            |
| DR Drill          | 2026-10-13 | sre + security     | —                    | —            |
| Incident tabletop | 2026-10-13 | security + product | —                    | —            |

## 템플릿 (실행 기록)

```yaml
drill_id: DRILL-ROLLBACK-2026-08-13
type: rollback # rollback|dr|incident-tabletop
started_at: ''
finished_at: ''
duration_sec: 0
known_good_sha: ''
result: PASS # PASS|FAIL
notes: ''
evidence_uri: ''
signed_by: { sre: '', product: '' }
```

R12에서 다음 Drill 일정을 재확인한다.

**R12 Implement (2026-07-13):** Rollback 2026-08-13 · DR/Incident 2026-10-13 — **scheduled** (기한 초과 아님). Checklist: [`R12/r12-dr-drill-checklist.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R12/r12-dr-drill-checklist.md).
