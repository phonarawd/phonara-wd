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

| Doc                                                                                                    | Role                                             |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| [`QUALITY_GATES.md`](QUALITY_GATES.md)                                                                 | Quality gate ladder                              |
| [`SSOT/OPERATOR_GATES.md`](SSOT/OPERATOR_GATES.md)                                                     | Operator gate entrypoint                         |
| [`SSOT/ENGINE_BOUNDARY.md`](SSOT/ENGINE_BOUNDARY.md)                                                   | Engine vs presentation                           |
| [`SSOT/PAYMENT_ARCHITECTURE_CANON.md`](SSOT/PAYMENT_ARCHITECTURE_CANON.md)                             | Payment rails canon                              |
| [`SSOT/CURSOR_AUTOPILOT.md`](SSOT/CURSOR_AUTOPILOT.md)                                                 | Cursor setup                                     |
| [`ENVIRONMENT_SETUP.md`](ENVIRONMENT_SETUP.md)                                                         | Dev environment                                  |
| [`RUNBOOK.md`](RUNBOOK.md)                                                                             | Operations                                       |
| [`OPERATIONS/PRE_LAUNCH_CHECKLIST_BEGINNER.md`](OPERATIONS/PRE_LAUNCH_CHECKLIST_BEGINNER.md)           | Pre-launch (operator)                            |
| [`OPERATIONS/P13_T0A_PROD_PREFLIGHT.md`](OPERATIONS/P13_T0A_PROD_PREFLIGHT.md)                         | P13 T0-A prod checklist · `#232` **`[x]`**       |
| [`OPERATIONS/PLATFORM_INTEGRITY_EVIDENCE/README.md`](OPERATIONS/PLATFORM_INTEGRITY_EVIDENCE/README.md) | PIR evidence **`[x]` DONE** · `#205` unblocked   |
| [`OPERATIONS/PLATFORM_AUDIT_FINDING_REGISTRY.yaml`](OPERATIONS/PLATFORM_AUDIT_FINDING_REGISTRY.yaml)   | Perfect Launch Finding registry (+`dod_profile`) |
| [`OPERATIONS/PLATFORM_AUDIT_RACI.md`](OPERATIONS/PLATFORM_AUDIT_RACI.md)                               | 1인 겸임 RACI                                    |
| [`PRODUCT/ADR/021-platform-observability-stack.md`](PRODUCT/ADR/021-platform-observability-stack.md)   | 관측/알림 스택 ADR (R0)                          |
| [`OPERATIONS/PLATFORM_EVIDENCE_RETENTION.md`](OPERATIONS/PLATFORM_EVIDENCE_RETENTION.md)               | Evidence bucket · 90일                           |
| [`OPERATIONS/PLATFORM_SLO_SLA.yaml`](OPERATIONS/PLATFORM_SLO_SLA.yaml)                                 | SLO/Trigger 수치 (draft→Owner)                   |
| [`audit/PLATFORM_AUDIT_REFERENCE.md`](audit/PLATFORM_AUDIT_REFERENCE.md)                               | Zero-assumption audit **참고** 정본              |

## Audit reports (PQA §33 · read-only)

| Doc                                                                                                              | Role                                         |
| ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| [`audit/PLATFORM_AUDIT_A_DB_GUARDS_2026-07-08.md`](audit/PLATFORM_AUDIT_A_DB_GUARDS_2026-07-08.md)               | Section A — guard/GRANT                      |
| [`audit/PLATFORM_AUDIT_B_RPC_CONTRACT_2026-07-08.md`](audit/PLATFORM_AUDIT_B_RPC_CONTRACT_2026-07-08.md)         | Section B — RPC/error/realtime               |
| [`audit/PLATFORM_AUDIT_C_SURFACE_CONTROLS_2026-07-08.md`](audit/PLATFORM_AUDIT_C_SURFACE_CONTROLS_2026-07-08.md) | Section C — surface/dead control             |
| [`audit/PLATFORM_AUDIT_D_CONFIG_STATE_2026-07-08.md`](audit/PLATFORM_AUDIT_D_CONFIG_STATE_2026-07-08.md)         | Section D — app_config/ops                   |
| [`audit/PLATFORM_AUDIT_E_SEVERITY_REPORT_2026-07-08.md`](audit/PLATFORM_AUDIT_E_SEVERITY_REPORT_2026-07-08.md)   | **Section E — P0–P3 결함 대장**              |
| [`audit/visual-ux-2026-07-11/README.md`](audit/visual-ux-2026-07-11/README.md)                                   | Visual/UX Director 입력 팩 · 스크린샷 스키마 |

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

| Doc                                                                                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`ADR/0002-engine-freeze.md`](ADR/0002-engine-freeze.md) — **Accepted** (Engine Apex closed)                                                             |
| [`PRODUCT/ADR/001-pg-less-funding-rails.md`](PRODUCT/ADR/001-pg-less-funding-rails.md)                                                                   |
| [`PRODUCT/ADR/002-crypto-custody-signing.md`](PRODUCT/ADR/002-crypto-custody-signing.md)                                                                 |
| [`PRODUCT/ADR/003-landing-timeless-conversion.md`](PRODUCT/ADR/003-landing-timeless-conversion.md) — Landing CVR pass                                    |
| [`PRODUCT/ADR/009-digital-aurora-brand-dna.md`](PRODUCT/ADR/009-digital-aurora-brand-dna.md) — Digital Aurora DA W0                                      |
| [`PRODUCT/ADR/ENGINE_GAP_ADR.md`](PRODUCT/ADR/ENGINE_GAP_ADR.md) — Track B E0–E10 gap index (**Accepted** 2026-07-11 · `#239`)                           |
| [`PRODUCT/ADR/010-tier-decay.md`](PRODUCT/ADR/010-tier-decay.md) — E1 Tier Decay (**Accepted** · `#240`)                                                 |
| [`PRODUCT/ADR/011-mission-catalog.md`](PRODUCT/ADR/011-mission-catalog.md) — E2 Mission Catalog CRUD (**Accepted** · `#242`)                             |
| [`PRODUCT/ADR/012-viral-cms.md`](PRODUCT/ADR/012-viral-cms.md) — E3 Viral leaderboard + CMS/promotions (**Accepted** · `#244`)                           |
| [`PRODUCT/ADR/013-tier-option-b.md`](PRODUCT/ADR/013-tier-option-b.md) — E4 Option B · Prime Elite (**Accepted** · `#246`)                               |
| [`PRODUCT/ADR/014-social-co-mission.md`](PRODUCT/ADR/014-social-co-mission.md) — E7 Social co-mission + whale (**Accepted** · `#252`)                    |
| [`OPERATIONS/ENGINE_GAP_E0_APPROVAL.md`](OPERATIONS/ENGINE_GAP_E0_APPROVAL.md) — E0 approval record · RED STOP · 광고·설문 영구 제외                     |
| [`OPERATIONS/ENGINE_GAP_E2_MISSIONS.md`](OPERATIONS/ENGINE_GAP_E2_MISSIONS.md) — E2 WAVE closeout · list/upsert RPC · GATE 후행                          |
| [`OPERATIONS/ENGINE_GAP_E3_VIRAL_CMS.md`](OPERATIONS/ENGINE_GAP_E3_VIRAL_CMS.md) — E3 WAVE closeout · leaderboard · CMS targeting                        |
| [`OPERATIONS/ENGINE_GAP_E3_GATE_CMS_PROMOTIONS.md`](OPERATIONS/ENGINE_GAP_E3_GATE_CMS_PROMOTIONS.md) — E3 GATE · remote apply · surface unlock           |
| [`OPERATIONS/ENGINE_GAP_E4_TIER_OPTION_B.md`](OPERATIONS/ENGINE_GAP_E4_TIER_OPTION_B.md) — E4 WAVE · Option B · Prime Elite                              |
| [`OPERATIONS/ENGINE_GAP_E4_GATE_TIER_OPTION_B.md`](OPERATIONS/ENGINE_GAP_E4_GATE_TIER_OPTION_B.md) — E4 GATE · fee % · VIP/elite unlock · remote apply   |
| [`OPERATIONS/ENGINE_GAP_E5_GAP_SURFACES.md`](OPERATIONS/ENGINE_GAP_E5_GAP_SURFACES.md) — E5 WIRE · decay · leaderboard · sports VIP live                 |
| [`OPERATIONS/ENGINE_GAP_E5_GATE_GAP_SURFACES.md`](OPERATIONS/ENGINE_GAP_E5_GATE_GAP_SURFACES.md) — E5 GATE · STUB→live unlock · gate:ai-impl             |
| [`OPERATIONS/ENGINE_GAP_E6_ADMIN_DESKS.md`](OPERATIONS/ENGINE_GAP_E6_ADMIN_DESKS.md) — E6 WAVE · Admin gap desks · audit CSV                             |
| [`OPERATIONS/ENGINE_GAP_E6_GATE_ADMIN_DESKS.md`](OPERATIONS/ENGINE_GAP_E6_GATE_ADMIN_DESKS.md) — E6 GATE · §29.5 · AdminTable · gate:ai-impl             |
| [`OPERATIONS/ENGINE_GAP_E7_SOCIAL.md`](OPERATIONS/ENGINE_GAP_E7_SOCIAL.md) — E7 WAVE · co-mission · whale threshold                                      |
| [`OPERATIONS/ENGINE_GAP_E7_GATE_ENGINE_WAVE.md`](OPERATIONS/ENGINE_GAP_E7_GATE_ENGINE_WAVE.md) — E7 GATE · social unlock · stack:push-remote · advisor 0 |
| [`ADR/0001-quality-gates.md`](ADR/0001-quality-gates.md) … [`0006`](ADR/0006-wallet-sigma-rule.md)                                                       |

## Rebuild runbooks (gates · low-spec)

| Doc                                                                  |
| -------------------------------------------------------------------- |
| [`rebuild/LOWSPEC_RULES.md`](rebuild/LOWSPEC_RULES.md)               |
| [`rebuild/E2E-LOWSPEC-RUNBOOK.md`](rebuild/E2E-LOWSPEC-RUNBOOK.md)   |
| [`rebuild/PHASE-D-GATE-RUNBOOK.md`](rebuild/PHASE-D-GATE-RUNBOOK.md) |
| [`rebuild/PHASE-R-GATE-RUNBOOK.md`](rebuild/PHASE-R-GATE-RUNBOOK.md) |

> `rebuild/NEXT_STEP.md` · `RELEASE_ROADMAP.md` — 2026-07-04 삭제된 문서 (deleted · git history) · 실행 큐 = [`SSOT/ACTIVE_WORK_SSOT.md`](SSOT/ACTIVE_WORK_SSOT.md)

## UX canon (Phase R · Digital Aurora)

| Doc                                                                                          | Role                                                                                |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [`SSOT/PRODUCT_EXPERIENCE_CANON.md`](SSOT/PRODUCT_EXPERIENCE_CANON.md)                       | **DA W0** Emotion · Brand Memory · elevation · motion · §35.1 Tech Stack            |
| [`SSOT/SOUND_DESIGN_CANON.md`](SSOT/SOUND_DESIGN_CANON.md)                                   | **DA W8 DOC** §34.27 mission·wallet·trade·vip 4톤 · 구현=E-Wave · GATE `#228` `[x]` |
| [`SSOT/UNIFIED_UX_CANON.md`](SSOT/UNIFIED_UX_CANON.md)                                       | Interaction Grammar · high-risk confirm                                             |
| [`SSOT/DESIGN_PRINCIPLES.md`](SSOT/DESIGN_PRINCIPLES.md)                                     | D0 + §7 Accessibility Elevation                                                     |
| [`SSOT/ADMIN_BEGINNER_LANGUAGE_CANON.md`](SSOT/ADMIN_BEGINNER_LANGUAGE_CANON.md)             | **P13 DOC** §29.1·§29.5 초등어 · `#229` `[x]`                                       |
| [`SSOT/ADMIN_TEAM_RBAC_CANON.md`](SSOT/ADMIN_TEAM_RBAC_CANON.md)                             | **P13 DOC** 역할 5종 · `/admin/team` 계약 · `#229` `[x]`                            |
| [`PHONARA_USER_ADMIN_CORRESPONDENCE_MATRIX.md`](PHONARA_USER_ADMIN_CORRESPONDENCE_MATRIX.md) | **P13 DOC** 유저↔Admin 1:1 · §12.14 sync · `#229` `[x]`                             |

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
