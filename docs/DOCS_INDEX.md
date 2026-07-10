# PHONARA Docs Index (v5.4 · Post Engine Apex)

> **Active execution:** [`SSOT/ACTIVE_WORK_SSOT.md`](SSOT/ACTIVE_WORK_SSOT.md) only  
> **Frozen / denylist:** [`SSOT/DEPRECATED_DOC_DENYLIST.md`](SSOT/DEPRECATED_DOC_DENYLIST.md)

## Active (AI implementation read)

| Doc                                                        | Role                                     |
| ---------------------------------------------------------- | ---------------------------------------- |
| [`SSOT/ACTIVE_WORK_SSOT.md`](SSOT/ACTIVE_WORK_SSOT.md)     | **유일한 실행 큐 정본**                  |
| [`PRODUCT/REBUILD_PLAN_v1.md`](PRODUCT/REBUILD_PLAN_v1.md) | Phase R 실행 정본                        |
| [`ENGINE_APEX_CLOSEOUT.md`](ENGINE_APEX_CLOSEOUT.md)       | Engine status · gates only (재착수 금지) |
| [`CURRENT_STATUS.md`](CURRENT_STATUS.md)                   | 한 페이지 상태 stub                      |

## Phase D · Demolition (DONE — history)

| Doc                                                                                | Role                                    |
| ---------------------------------------------------------------------------------- | --------------------------------------- |
| [`PRODUCT/DEMOLITION_PLAN.md`](PRODUCT/DEMOLITION_PLAN.md)                         | 완료 이력 · batch 증거 (재실행 큐 아님) |
| [`PRODUCT/ADR/000-v5-demolition-first.md`](PRODUCT/ADR/000-v5-demolition-first.md) | Demolition ADR                          |

> `PRE_DEMOLITION_INVENTORY.md` · `DEMOLITION_CLOSEOUT_PLAN.md`는 2026-07-04 삭제 — git history (tag `ui-v3-final-backup`)

## Engine · Gates · Ops (boundary / operator)

| Doc                                                                                          | Role                     |
| -------------------------------------------------------------------------------------------- | ------------------------ |
| [`QUALITY_GATES.md`](QUALITY_GATES.md)                                                       | Quality gate ladder      |
| [`SSOT/OPERATOR_GATES.md`](SSOT/OPERATOR_GATES.md)                                           | Operator gate entrypoint |
| [`SSOT/ENGINE_BOUNDARY.md`](SSOT/ENGINE_BOUNDARY.md)                                         | Engine vs presentation   |
| [`SSOT/PAYMENT_ARCHITECTURE_CANON.md`](SSOT/PAYMENT_ARCHITECTURE_CANON.md)                   | Payment rails canon      |
| [`SSOT/CURSOR_AUTOPILOT.md`](SSOT/CURSOR_AUTOPILOT.md)                                       | Cursor setup             |
| [`ENVIRONMENT_SETUP.md`](ENVIRONMENT_SETUP.md)                                               | Dev environment          |
| [`RUNBOOK.md`](RUNBOOK.md)                                                                   | Operations               |
| [`OPERATIONS/PRE_LAUNCH_CHECKLIST_BEGINNER.md`](OPERATIONS/PRE_LAUNCH_CHECKLIST_BEGINNER.md) | Pre-launch (operator)    |
| [`OPERATIONS/PLATFORM_INTEGRITY_EVIDENCE/README.md`](OPERATIONS/PLATFORM_INTEGRITY_EVIDENCE/README.md) | PIR 형제 큐 evidence · `#205` BLOCKED |

## Audit reports (PQA §33 · read-only)

| Doc                                                                                                              | Role                             |
| ---------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| [`audit/PLATFORM_AUDIT_A_DB_GUARDS_2026-07-08.md`](audit/PLATFORM_AUDIT_A_DB_GUARDS_2026-07-08.md)               | Section A — guard/GRANT          |
| [`audit/PLATFORM_AUDIT_B_RPC_CONTRACT_2026-07-08.md`](audit/PLATFORM_AUDIT_B_RPC_CONTRACT_2026-07-08.md)         | Section B — RPC/error/realtime   |
| [`audit/PLATFORM_AUDIT_C_SURFACE_CONTROLS_2026-07-08.md`](audit/PLATFORM_AUDIT_C_SURFACE_CONTROLS_2026-07-08.md) | Section C — surface/dead control |
| [`audit/PLATFORM_AUDIT_D_CONFIG_STATE_2026-07-08.md`](audit/PLATFORM_AUDIT_D_CONFIG_STATE_2026-07-08.md)         | Section D — app_config/ops       |
| [`audit/PLATFORM_AUDIT_E_SEVERITY_REPORT_2026-07-08.md`](audit/PLATFORM_AUDIT_E_SEVERITY_REPORT_2026-07-08.md)   | **Section E — P0–P3 결함 대장**  |

재현: `bun run audit:pqa-c` · `bun run audit:pqa-d` · `bun run check:engine-foundation-parity`

## Product OS (Landing CVR pass · Phase 0 동결)

| Doc                                                                                                | Role                                               |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| [`PRODUCT/PRODUCT_OPERATING_SYSTEM.md`](PRODUCT/PRODUCT_OPERATING_SYSTEM.md)                       | Product OS 루트 · doc freeze · 구현 우선순위       |
| [`PRODUCT/LANDING_PRODUCT_SPEC.md`](PRODUCT/LANDING_PRODUCT_SPEC.md)                               | CVR-first fold IA · 컴포넌트 매핑                  |
| [`PRODUCT/DESIGN_CHARTER.md`](PRODUCT/DESIGN_CHARTER.md)                                           | Voice · Motion · timeless tokens · DA brand memory |
| [`PRODUCT/SUCCESS_METRICS.md`](PRODUCT/SUCCESS_METRICS.md)                                         | North Star · landing funnel events                 |
| [`PRODUCT/SCOPE_TRACK3_DECISION.md`](PRODUCT/SCOPE_TRACK3_DECISION.md)                             | Track 3 스코프 (3a/3c 활성) · operator 서명 대기   |
| [`PRODUCT/ADR/003-landing-timeless-conversion.md`](PRODUCT/ADR/003-landing-timeless-conversion.md) | CVR pass 구현 ADR                                  |
| [`PRODUCT/ADR/009-digital-aurora-brand-dna.md`](PRODUCT/ADR/009-digital-aurora-brand-dna.md)       | Digital Aurora 5문법 · elevation · motion L0–L2    |

## ADR

| Doc                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------------- |
| [`ADR/0002-engine-freeze.md`](ADR/0002-engine-freeze.md) — **Accepted** (Engine Apex closed)                          |
| [`PRODUCT/ADR/001-pg-less-funding-rails.md`](PRODUCT/ADR/001-pg-less-funding-rails.md)                                |
| [`PRODUCT/ADR/002-crypto-custody-signing.md`](PRODUCT/ADR/002-crypto-custody-signing.md)                              |
| [`PRODUCT/ADR/003-landing-timeless-conversion.md`](PRODUCT/ADR/003-landing-timeless-conversion.md) — Landing CVR pass |
| [`PRODUCT/ADR/009-digital-aurora-brand-dna.md`](PRODUCT/ADR/009-digital-aurora-brand-dna.md) — Digital Aurora DA W0   |
| [`PRODUCT/ADR/ENGINE_GAP_ADR.md`](PRODUCT/ADR/ENGINE_GAP_ADR.md) — Track B E0–E10 gap index (draft · E0 승인 대기)    |
| [`ADR/0001-quality-gates.md`](ADR/0001-quality-gates.md) … [`0006`](ADR/0006-wallet-sigma-rule.md)                    |

## Rebuild runbooks (gates · low-spec)

| Doc                                                                  |
| -------------------------------------------------------------------- |
| [`rebuild/LOWSPEC_RULES.md`](rebuild/LOWSPEC_RULES.md)               |
| [`rebuild/E2E-LOWSPEC-RUNBOOK.md`](rebuild/E2E-LOWSPEC-RUNBOOK.md)   |
| [`rebuild/PHASE-D-GATE-RUNBOOK.md`](rebuild/PHASE-D-GATE-RUNBOOK.md) |
| [`rebuild/PHASE-R-GATE-RUNBOOK.md`](rebuild/PHASE-R-GATE-RUNBOOK.md) |

> `rebuild/NEXT_STEP.md` · `RELEASE_ROADMAP.md` — 2026-07-04 삭제된 문서 (deleted · git history) · 실행 큐 = [`SSOT/ACTIVE_WORK_SSOT.md`](SSOT/ACTIVE_WORK_SSOT.md)

## UX canon (Phase R · Digital Aurora)

| Doc                                                                    | Role                                                                     |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [`SSOT/PRODUCT_EXPERIENCE_CANON.md`](SSOT/PRODUCT_EXPERIENCE_CANON.md) | **DA W0** Emotion · Brand Memory · elevation · motion · §35.1 Tech Stack |
| [`SSOT/UNIFIED_UX_CANON.md`](SSOT/UNIFIED_UX_CANON.md)                 | Interaction Grammar · high-risk confirm                                  |
| [`SSOT/DESIGN_PRINCIPLES.md`](SSOT/DESIGN_PRINCIPLES.md)               | D0 + §7 Accessibility Elevation                                          |

`SSOT/*_UX_CANON.md` · `UX_REFERENCE_CANON.md` · `SURFACE_BLUEPRINTS.md` · `PRODUCT_PRINCIPLES.md` · `COPYWRITING_CANON.md` · `I18N_FIRST.md`

## Platform canon (§32 · Track A narrative · engine 0)

| Doc                                                                    | Role                                    |
| ---------------------------------------------------------------------- | --------------------------------------- |
| [`SSOT/GLOBAL_EXPANSION.md`](SSOT/GLOBAL_EXPANSION.md)                 | Locale · currency · region slots        |
| [`SSOT/ONBOARDING_JOURNEY_CANON.md`](SSOT/ONBOARDING_JOURNEY_CANON.md) | First 7-day journey §13.11              |
| [`SSOT/PLATFORM_NARRATIVE_CANON.md`](SSOT/PLATFORM_NARRATIVE_CANON.md) | Positioning · pillars · trust narrative |

**코드 계약:** `apps/web/src/domain/platform-narrative-display-contract.ts` · `onboarding-journey-display-contract.ts` · `operator-trust-pages-display-contract.ts`

## Frozen evidence (2026-07-04 워킹트리 삭제 — git history only)

`ENGINE_PHASE*_EVIDENCE_REPORT.md` · `ENGINE_POST_APEX_*` · `ENGINE_FORENSIC_*` · `ENGINE_STATE_AUDIT_*` · `ENGINE_FINAL_FUNDING_PLAN_CLOSEOUT.md` — **워킹트리에서 삭제됨** · 원문 = git history · 수치 정본 = [`ENGINE_APEX_CLOSEOUT.md`](ENGINE_APEX_CLOSEOUT.md) (denylist 유지)
