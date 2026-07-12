# PrimeForge Engine Apex — 최종 Closeout SSOT

> **AI:** 본 문서 = **상태·게이트 수치 정본만**. Phase evidence reports는 감사 이력 — **구현 큐로 읽지 않음** ([`ACTIVE_WORK_SSOT.md`](SSOT/ACTIVE_WORK_SSOT.md)).

작성일: 2026-07-03  
상태: **`[x] FULLY CLOSED`** — Engine Apex Plan Phase 0–6 + Closed Beta prep + Phase 8 + Post-Apex P1/P2  
범위: 돈 · 원장 · 정산 · 권한 · Edge orchestration · 운영 관측성 (UI/프레젠테이션 제외)

> **§35.4 Apex / Migration 정직 (52차 · 소급 금지):** 본 문서 수치(**191**/192 · **99**/99) = **Apex CLOSEOUT 스냅샷 (2026-07-03)**.  
> **Current disk (2026-07-09):** migrations **211** · SQL tests **117** (Launch E1–E5 · Trade T0–T3 · Phase E · PQA E5 포함).  
> closeout 수치를 현재 gate로 쓰지 말 것 — 정본 표는 Plan §35.4.

**엔진 구현 큐 0** — 이 문서 이후 엔진 코드/RPC/migration 신규 작업 없음. 다음은 Phase D(삭제) · operator gate · Phase R UI만.

> **단일 진입점:** 엔진 작업 완료 판정은 본 문서 + `test:sql` **99/99** + migration parity + remote advisor **0 ERROR**로 닫는다. **엔진 구현 큐 0** — 이후는 operator gate · Phase R만.  
> **Evidence 문서 정리 (2026-07-04):** Phase별 evidence report `.md`는 워킹트리에서 **삭제** — 원문은 git history에서 조회. 본 문서의 수치가 유일한 참조 정본.  
> **Migration 실측 (2026-07-04):** post-closeout CI fix(`aal2_guard` rename)로 **192** · lock parity 192.

---

## 최종 게이트 (2026-07-03)

| Gate                                       | 결과                               | 증거                                                                                                                                                                |
| ------------------------------------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `typecheck`                                | green                              | 2026-07-03 evening ladder confirmed                                                                                                                                 |
| Package unit (engine + edge observability) | **275/275**                        | `packages/money` · `wallet-ledger` · `trading-engine` · `game-engine` · `sportsbook-engine` · `edge-observability.test.ts`                                          |
| Engine gate: `bun run test:engine`         | **275/275** (2026-07-03 confirmed) | 단일 스크립트 재현 — `package.json` `test:engine`                                                                                                                   |
| `supabase db reset` → `test:sql`           | **99/99**                          | Σ=0 · hash-chain · circuit_breaker · provider_capabilities                                                                                                          |
| `stack:push-remote`                        | parity OK                          | tail `p6_edge_observability` · pending 0                                                                                                                            |
| `check:engine-foundation-parity`           | **191 = 191**                      | missing 0                                                                                                                                                           |
| `check:advisors`                           | **0 ERROR**                        | 151 WARN · 158 INFO (분류 완료 — Phase 8 report)                                                                                                                    |
| Operator full ladder (2026-07-03 evening)  | **전부 green**                     | `typecheck` · `test:engine` 275/275 · `test:sql` 99/99 · `stack:push-remote` pending 0 · parity 191/191 · `check:env` · `check:domain-stack` · `dump:engine` FAIL 0 |

증거 원문: `ENGINE_PHASE8_FINAL_GATES_EVIDENCE_REPORT.md` (2026-07-04 삭제 — git history)

---

## Phase 완료 매트릭스

> Evidence 열의 report `.md`는 **2026-07-04 워킹트리에서 삭제** — 파일명은 git history 조회 키.

| Phase                                 | Plan todo                        | 상태                              | Evidence (git history)                                                                                                                                            |
| ------------------------------------- | -------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 — Foundation & Safety Baseline      | `p0-foundation`                  | **[x] DONE**                      | `ENGINE_PHASE0_EVIDENCE_REPORT.md`                                                                                                                                |
| 1 — External High-Risk Path Hardening | `p1-edge-hardening`              | **[x] DONE**                      | Phase 0 §P0 Edge Contracts · forensic §13                                                                                                                         |
| 2 — DB Security & Permission          | `p2-db-security`                 | **[x] DONE**                      | `ENGINE_PHASE2_DB_SECURITY_EVIDENCE_REPORT.md`                                                                                                                    |
| 2.5 — Admin/Ops Observability         | `p25-admin-ops`                  | **[x] DONE**                      | `ENGINE_PHASE25_ADMIN_OPS_VISIBILITY_EVIDENCE_REPORT.md`                                                                                                          |
| 3 — Package Invariants                | `p3-package-invariants`          | **[x] DONE**                      | `ENGINE_PHASE3_PACKAGE_INVARIANTS_EVIDENCE_REPORT.md`                                                                                                             |
| 4 — Casino Conservation               | `p3-casino-conservation`         | **[x] DONE**                      | `ENGINE_PHASE4_CASINO_CONSERVATION_EVIDENCE_REPORT.md`                                                                                                            |
| 5 — Sportsbook Authority              | `p4-sportsbook-authority`        | **[x] DONE**                      | `ENGINE_PHASE5_SPORTSBOOK_AUTHORITY_EVIDENCE_REPORT.md`                                                                                                           |
| 6 — Edge Observability                | `p6-edge-observability`          | **[x] DONE**                      | `ENGINE_PHASE6_EDGE_OBSERVABILITY_EVIDENCE_REPORT.md`                                                                                                             |
| 6b — Closed Beta Readiness (prep)     | `p6-closed-beta-money-rehearsal` | **[x] DONE** (rehearsal deferred) | `ENGINE_PHASE6_CLOSED_BETA_READINESS_EVIDENCE_REPORT.md` · [`ENGINE_CLOSED_BETA_SCENARIO_MATRIX.md`](ENGINE_CLOSED_BETA_SCENARIO_MATRIX.md) (KEEP — P13 operator) |
| 8 — Final Engine Gates                | `p6-final-gates`                 | **[x] DONE**                      | `ENGINE_PHASE8_FINAL_GATES_EVIDENCE_REPORT.md`                                                                                                                    |
| 9 — Post-Apex P1/P2 Hardening         | `post-apex-p1-p2`                | **[x] DONE**                      | `ENGINE_POST_APEX_P1_P2_EVIDENCE_REPORT.md`                                                                                                                       |
| 7 — Prod real-money rehearsal         | —                                | **DEFERRED**                      | operator 명시 승인 전 blocked                                                                                                                                     |

포렌식 감사 원문 + closeout addendum: `ENGINE_FORENSIC_AUDIT_2026-07-03.md` §13–§20 (git history)

---

## Operator 재현 (저사양 · 순차 1회)

```powershell
Set-Location c:\Users\PC\Desktop\phonara-gb
bun run typecheck
bun run test:engine
bun run pretest:sql
supabase db reset
bun run test:sql
bun run stack:push-remote
bun run check:advisors
bun run check:engine-foundation-parity
```

Edge lightweight smoke (P0 — 함수 코드 변경 시):

```powershell
bun run stack:verify-worldno1-edge
bun run stack:smoke-pg-webhook-hmac
```

---

## Advisor WARN 분류 (ERROR 0 = 완료 조건)

| 항목                                                 | count | 분류                                              |
| ---------------------------------------------------- | ----- | ------------------------------------------------- |
| `authenticated_security_definer_function_executable` | 135   | **의도** — guarded `rpc_*` client surface         |
| `auth_rls_initplan`                                  | 11    | **defer** — 성능 튜닝 큐                          |
| `anon_security_definer_function_executable`          | 4     | **의도** — public read allowlist (inventory test) |
| `auth_leaked_password_protection`                    | 1     | **defer** — Pro+ entitlement · `bun run stack:auth-hibp-enable` (H-09 · 2026-07-13 402) |
| `unused_index` (INFO)                                | 157   | **defer** — 운영 쿼리 evidence 후                 |
| `rls_enabled_no_policy` (INFO)                       | 1     | **의도** — internal table                         |

---

## 의도적 defer (Engine Apex 범위 밖)

| 항목                                   | 사유                                           | 다음 큐                                                              |
| -------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------- |
| Prod real-money rehearsal              | irreversible audit · operator allowlist 미준비 | 「Closed Beta gate 실행」 + scenario matrix exit                     |
| SQL `_apply_funding` wallet settlement | preview-only 유지                              | trading engine slice                                                 |
| Performance WARN (`auth_rls_initplan`) | 운영 evidence 필요                             | DB 튜닝 migration                                                    |
| E2E full suite · `check:full`          | G13 저사양                                     | CI / operator 「gate 실행」                                          |
| Phase D Demolition                     | Engine Apex와 별도 SSOT                        | `DEMOLITION_PLAN` Batch 11½                                          |
| Phase R UI rebuild                     | presentation 삭제 상태                         | [`REBUILD_PLAN_v1`](../PRODUCT/REBUILD_PLAN_v1.md) 승인 · P1 진행 중 |

---

## Post-Apex P1/P2 Hardening — `[x] DONE` (2026-07-03)

코드 감사 `ENGINE_STATE_AUDIT_2026-07-03.md` (git history) E1–E5 보강.

| 항목                              | Closeout                                                            |
| --------------------------------- | ------------------------------------------------------------------- |
| E1 `usdt-krw-feed` JS number 제거 | `upbit-rate-parse.ts` — regex/decimal string only                   |
| E2 notification outbound HMAC     | `outbound-dispatch-auth.ts` · `EMAIL/WEB_PUSH_DISPATCH_HMAC_SECRET` |
| E3 `circuit_breaker_state` DB     | migration `engine_post_apex_p1_p2_hardening` · assess/record RPC    |
| E4 provider capabilities          | `notification_provider_capabilities` table + SQL inventory test     |
| E5 `set_updated_at` search_path   | same migration                                                      |

| Gate                | 결과                                                     |
| ------------------- | -------------------------------------------------------- |
| `test:sql`          | **99/99**                                                |
| `stack:push-remote` | `engine_post_apex_p1_p2_hardening` applied               |
| Migration parity    | **191/191**                                              |
| `check:advisors`    | **0 ERROR**                                              |
| Edge deploy         | `usdt-krw-feed` · `notification-dispatch` · `price-feed` |

증거: `ENGINE_POST_APEX_P1_P2_EVIDENCE_REPORT.md` (git history) · migration `20260716000001_engine_post_apex_p1_p2_hardening` · `circuit_breaker_state_test.sql` · `notification_provider_capabilities_test.sql`

---

## 교차 참조

- Engine boundary: [`SSOT/ENGINE_BOUNDARY.md`](SSOT/ENGINE_BOUNDARY.md)
- Final funding plan closeout: `ENGINE_FINAL_FUNDING_PLAN_CLOSEOUT.md` (git history) · ADR [`PRODUCT/ADR/001-pg-less-funding-rails.md`](PRODUCT/ADR/001-pg-less-funding-rails.md)
- **출시 전 operator 체크 (왕초보):** [`OPERATIONS/PRE_LAUNCH_CHECKLIST_BEGINNER.md`](OPERATIONS/PRE_LAUNCH_CHECKLIST_BEGINNER.md)
- Operator gates: [`SSOT/OPERATOR_GATES.md`](SSOT/OPERATOR_GATES.md)
- Quality gates: [`QUALITY_GATES.md`](QUALITY_GATES.md)
- Agents entry: [`AGENTS.md`](../AGENTS.md)
- Supabase agents: [`supabase/AGENTS.md`](../supabase/AGENTS.md)
