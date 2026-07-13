# R10 — 24h Soak Snapshot (operator template)

> **Plan todo:** `audit-r10-rollout-soak`  
> **상태:** **TEMPLATE READY** (Phase 7 · 2026-07-14) — operator가 soak **개시일**을 확정하고 24h 창 종료 후 채움  
> **SOP:** [`PLATFORM_R10_ROLLOUT_SOAK.md`](../../PLATFORM_R10_ROLLOUT_SOAK.md) §4  
> **AI 금지:** 본 문서의 Window/Checkpoint/Sign-off를 에이전트가 채우거나 PASS로 위조하지 않는다.

## Phase 7 — 착수 가능 여부 (코드 전제)

| 전제 | 상태 | 근거 |
| --- | --- | --- |
| Phase 2 (SA-01 · CI sql · push-remote · parity) | **`[x]` DONE** | [`PLAN-ZERO-DEFECT-CRITICAL-HARDENING.md`](../../../PLAN-ZERO-DEFECT-CRITICAL-HARDENING.md) Phase 2 |
| Phase 4 (R9-PERF-JS · Stage1 ≤450) | **`[x]` DONE** | registry `VERIFIED_FIXED` · local **394.00 kB** |
| Freeze ACTIVE | 유지 | Critical Fix 외 · soak는 flip 0 Soft Launch 경로 |
| soak 개시일 | **operator 확정 필요** | 아래 Window — AI가 날짜를 넣지 않음 |

## Window

| Field            | Value              |
| ---------------- | ------------------ |
| `soak_start_at`  | _ISO8601 KST — operator fill_ |
| `soak_end_at`    | _ISO8601 KST — operator fill_ |
| `known_good_sha` | _40-hex — operator fill_ |
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
waiver_ids: [] # R9-PERF-JS no longer required (VERIFIED_FIXED 2026-07-14)
evidence_uri: docs/OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R10/r10-soak-24h-snapshot.md
```

## Operator next (본 템플릿 이후)

1. soak-24h **PASS** Evidence 기록
2. PPR 24h / 72h / 7d — [`PLATFORM_POST_RELEASE_REVIEW.md`](../../PLATFORM_POST_RELEASE_REVIEW.md) · R12 templates
3. rollback drill (2026-08-13) · DR drill (2026-10-13 또는 Public 전 앞당김)
4. 3-Owner sign-off — [`r11-3-owner-signoff-template.md`](../R11/r11-3-owner-signoff-template.md)
5. Freeze lift + Release Gate 최종 재판정
