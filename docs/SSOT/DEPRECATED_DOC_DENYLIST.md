# Deprecated Doc Denylist (v5.6 · 2026-07-04 Phase R plan 승인)

> **목적:** 완료된 엔진·Demolition·v2 실행 문서를 **active implementation SSOT**로 인용하는 것을 차단한다.  
> **정본:** `scripts/check-ai-reference-legacy.ts` (`bun run check:ai-reference`)  
> **v5.5:** frozen evidence `.md` + 구 로드맵/closeout 문서는 **워킹트리에서도 삭제됨** (2026-07-04 · 원문 git history) — 아래 목록은 복원·재인용 금지 카탈로그.

## Active execution SSOT (유일)

- [`docs/SSOT/ACTIVE_WORK_SSOT.md`](ACTIVE_WORK_SSOT.md)
- [`docs/PRODUCT/REBUILD_PLAN_v1.md`](../PRODUCT/REBUILD_PLAN_v1.md) — Phase R 실행 정본 (2026-07-04 승인)

## Engine — status only (구현 큐 아님)

- [`docs/ENGINE_APEX_CLOSEOUT.md`](../ENGINE_APEX_CLOSEOUT.md) — 게이트 수치 · `[x] FULLY CLOSED` 판정만

## Frozen engine evidence (2026-07-04 워킹트리 삭제 — git history · 복원 금지)

```text
docs/ENGINE_PHASE0_EVIDENCE_REPORT.md
docs/ENGINE_PHASE2_DB_SECURITY_EVIDENCE_REPORT.md
docs/ENGINE_PHASE25_ADMIN_OPS_VISIBILITY_EVIDENCE_REPORT.md
docs/ENGINE_PHASE3_PACKAGE_INVARIANTS_EVIDENCE_REPORT.md
docs/ENGINE_PHASE4_CASINO_CONSERVATION_EVIDENCE_REPORT.md
docs/ENGINE_PHASE5_SPORTSBOOK_AUTHORITY_EVIDENCE_REPORT.md
docs/ENGINE_PHASE6_EDGE_OBSERVABILITY_EVIDENCE_REPORT.md
docs/ENGINE_PHASE6_CLOSED_BETA_READINESS_EVIDENCE_REPORT.md
docs/ENGINE_PHASE8_FINAL_GATES_EVIDENCE_REPORT.md
docs/ENGINE_POST_APEX_P1_P2_EVIDENCE_REPORT.md
docs/ENGINE_FINAL_FUNDING_PLAN_CLOSEOUT.md
docs/ENGINE_FORENSIC_AUDIT_2026-07-03.md
docs/ENGINE_STATE_AUDIT_2026-07-03.md
docs/ENGINE_CLOSED_BETA_SCENARIO_MATRIX.md
```

## Demolition — DONE (batch 재실행 큐 아님)

- [`docs/PRODUCT/DEMOLITION_PLAN.md`](../PRODUCT/DEMOLITION_PLAN.md) — 완료 이력 · 증거 표만

## Deleted — never cite as live queue (Batch 11 `git rm`)

```text
docs/SSOT/UIUX_FULL_REBUILD_EXECUTION.md
docs/SSOT/MASTER_TODO.md
docs/SSOT/UI_REBUILD_WAVE.md
docs/SSOT/NEXT_STEP.md
docs/SSOT/AI_REFERENCE_PRIORITY.md
docs/SSOT/LEGACY_SURFACE_MAP.md
docs/SSOT/PRESENTATION_REBUILD_SCOPE.md
docs/SSOT/REBUILD_ENGINE_SSOT.md
docs/SSOT/ROUTE_ENGINE_CONTRACT.md
docs/SSOT/DESIGN_SYSTEM_V2.md
docs/SSOT/DECISION_LOG.md
docs/analysis/**
docs/PRODUCT_VISION.md
docs/FOLDER_STRUCTURE.md
docs/REBUILD_ENGINE_FINDINGS.md
docs/RELEASE_ROADMAP.md              # 2026-07-04 삭제 — 구 로드맵 (현행 = Phase R 플랜)
docs/rebuild/NEXT_STEP.md            # 2026-07-04 삭제 — 실행 큐 = ACTIVE_WORK_SSOT
docs/rebuild/DEMOLITION_CLOSEOUT_PLAN.md   # 2026-07-04 삭제 — Demolition DONE
docs/archive/PRE_DEMOLITION_INVENTORY.md   # 2026-07-04 삭제 — tag ui-v3-final-backup
```

## Legacy tokens (gate files — active reference 금지)

`PHONARA_ACTIVE_ROADMAP` · `MASTER_EXECUTION_PROMPT` · `PHONARA_DESIGN_CANON_40` · `R3-agent-handoff`  
`ENGINE_PHASE0` · `ENGINE_PHASE2` · `p0-foundation` · `p6-final-gates` — **todo 재착수 큐로 인용 금지**

## Allowed with deprecated context only

`REBUILD_PLAN_TBD.md` — superseded stub · active = [`REBUILD_PLAN_v1.md`](../PRODUCT/REBUILD_PLAN_v1.md)  
`RELEASE_ROADMAP.md` — Phase A~R **이력** · live tracker **아님**  
`docs/rebuild/*` — low-spec/gate runbook만 KEEP · UI execution plan **아님**  
UX canon (`*_UX_CANON.md`) — Phase R **의도 참조** · 구현 큐 **아님** (Plan 승인 전)

## Active Admin operator SSOT (denylist 아님 · P13 DOC)

- [`docs/PHONARA_USER_ADMIN_CORRESPONDENCE_MATRIX.md`](../PHONARA_USER_ADMIN_CORRESPONDENCE_MATRIX.md) — 유저↔Admin 1:1 · `p13-prep-admin-canonical-docs` **`[x]`**
- [`docs/SSOT/ADMIN_BEGINNER_LANGUAGE_CANON.md`](ADMIN_BEGINNER_LANGUAGE_CANON.md) — §29.5 초등어
- [`docs/SSOT/ADMIN_TEAM_RBAC_CANON.md`](ADMIN_TEAM_RBAC_CANON.md) — 역할 5종

## Cursor index

엔진 evidence `.md`는 2026-07-04 워킹트리에서 삭제됨 — `.cursorignore` 잔여 항목은 무해 (재생성 방지용 유지 가능). 원문 조회는 `git log --all -- docs/<파일명>`.
