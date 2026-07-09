# Trade Desk — Migration Verification Ladder (P4-D)

> **Todo:** `p4-migration-verify` · Plan `trade_desk_qa_audit` P4-D · 중대 #6  
> **Status:** `[x]` impl 2026-07-08 · operator 서면 승인 + security-auditor 사전 review Verified pending  
> **교차:** [`TRADE_DESK_RELEASE_ROLLBACK_RUNBOOK.md`](TRADE_DESK_RELEASE_ROLLBACK_RUNBOOK.md) · [`96-prod-apply-agent-deny`](../../.cursor/rules/96-prod-apply-agent-deny.mdc) · E0 [`P4/migration-verify-ladder.md`](TRADE_DESK_ZERO_DEFECT_EVIDENCE/P4/migration-verify-ladder.md)

---

## 목적

Trade desk Zero-Defect 기간 **엔진 freeze** 하에서 `supabase/migrations` touch를 **유일한 승인 체계**로 고정한다.  
P0~P3는 **UI-only · migration 0** — 승인 없는 migration = **FAIL** · **우회 창구 금지**.

**코드 정본:** [`trade-desk-migration-verify-display-contract.ts`](../../apps/web/src/domain/trade-desk-migration-verify-display-contract.ts)

---

## 기본 원칙 (non-waivable)

| 원칙                   | 내용                                                              |
| ---------------------- | ----------------------------------------------------------------- |
| **P0~P3 기본**         | UI-only · **migration 0** — deploy = frontend artifact만          |
| **불가피 판정**        | UI-only·display contract로 불충분 **AND** migration이 유일한 해결 |
| **Operator 서면 승인** | E0 signoff doc 행만 유효 — **채팅/이메일/구두 금지**              |
| **security-auditor**   | local `db reset` **전** readonly pre-review **PASS** 필수         |
| **엔진 freeze**        | §0 ACTIVE_WORK_SSOT — 승인 없는 migration = 작업 **FAIL**         |
| **롤백**               | applied migration **역삭제 금지** — forward-fix only (P4-C)       |

**P1-C 2단계 (engine):** claim disable 등 UI-only 1단계로 충분하면 migration **금지** — 2단계 진입 = 본 표 3 gate **전부** green.

---

## 승인 게이트 (3종 · 순서 고정)

| #   | Gate                 | 요구                              | 증거 (E0)                                                                                                            | 무효 조건                                  |
| --- | -------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| 1   | **impossibility**    | UI-only 불충분 · migration 불가피 | [`P4/migration-verify-ladder.md`](TRADE_DESK_ZERO_DEFECT_EVIDENCE/P4/migration-verify-ladder.md) scope 행            | "편의" · Engine Wave defer 항목 무단 착수  |
| 2   | **operator-signoff** | Operator **서면** 승인            | [`P4/migration-operator-signoff.md`](TRADE_DESK_ZERO_DEFECT_EVIDENCE/P4/migration-operator-signoff.md)               | chat-only approval · migration 파일명 누락 |
| 3   | **security-auditor** | 사전 review **PASS**              | [`P4/migration-security-auditor-review.md`](TRADE_DESK_ZERO_DEFECT_EVIDENCE/P4/migration-security-auditor-review.md) | apply 후 review · FAIL 미해결              |

> Gate 3 PASS 없이 Gate 4(로컬 apply) 착수 = **FAIL**.

---

## Migration apply 래더 (8단계)

| Step | Phase     | 액션                                                                | 정본                                  |
| ---- | --------- | ------------------------------------------------------------------- | ------------------------------------- |
| 1    | preflight | E0 3 gate 문서화 · engine freeze 확인                               | Plan P4-D                             |
| 2    | draft     | **신규** migration 파일만 — remote applied 파일 retro-edit **금지** | `25-postgres-plpgsql`                 |
| 3    | local     | `supabase db reset`                                                 | apply-time SQL error 포착             |
| 4    | local     | `bun run test:sql` — Σ=0 + hash-chain                               | CI **sql** job authoritative (G13)    |
| 5    | local     | RLS/GRANT 변경 시 `grants_rls_inventory_test.sql` 갱신              | pairing rule                          |
| 6    | remote    | **`bun run stack:push-remote` only**                                | `96-prod-apply-agent-deny`            |
| 7    | remote    | Remote security advisor **0 ERROR**                                 | CI **advisors** job                   |
| 8    | closeout  | E0 ladder 행 + release runbook deploy log 1행                       | `(frontend_sha, migration_list_hash)` |

**Agent 자율 금지 (G13):** `test:sql` · `db reset` · full E2E — push 후 `bun run ci:status`.

---

## 우회 창구 금지 (FAIL)

| 금지                                        | 이유                                               |
| ------------------------------------------- | -------------------------------------------------- |
| `supabase db push` / `migration up`         | raw prod apply — hook deny                         |
| MCP `apply_migration` 직접 호출             | `stack:push-remote`와 drift                        |
| `PHONARA_ALLOW_PROD_DB_PUSH=1`              | legacy 우회 — trade desk migration에 **사용 금지** |
| chat-only approval / email-only approval    | 서면 signoff doc 아님                              |
| applied migration rollback / down migration | P4-C forward-fix only                              |
| P0~P3 tier에서 "긴급" migration             | P4-D gate 없이 engine freeze 위반                  |

**판정 헬퍼 (코드):** `evaluateMigrationTouch({ tier, operatorSignoff, securityAuditorPass, uiOnlySufficient, migrationUnavoidable })`

---

## 불가피 판정 체크리스트 (operator)

| 질문                                                                                 | YES →                                                                                                                              | NO →               |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| UI-only(display contract · RPC read path)로 해결 가능?                               | migration **금지**                                                                                                                 | 다음 행            |
| Engine Wave defer 항목인가? (CLOB · tier accrual · Accounting full · **DB TX Race**) | RED STOP · [`ENGINE_BOUNDARY.md`](../SSOT/ENGINE_BOUNDARY.md) §defer · ADR [005–008](../PRODUCT/ADR/005-engine-wave-clob-defer.md) | 다음 행            |
| 버그/감audit P0·P1 필수 수정인가?                                                    | 3 gate 진행                                                                                                                        | migration **금지** |
| P1-C claim 등 — tierError disable으로 충분?                                          | migration **금지**                                                                                                                 | 3 gate 진행        |

---

## Release 교차 (P4-C)

- migration apply 후 deploy log: [`TRADE_DESK_RELEASE_ROLLBACK_RUNBOOK.md`](TRADE_DESK_RELEASE_ROLLBACK_RUNBOOK.md) §Compatibility
- Frontend rollback + backend migration applied = **UNSUPPORTED** — forward-fix only
- `migration_list_hash` = `supabase/migrations.lock.json` canonical SHA256

---

## DoD (P4-D)

| 항목                                      | Gate                                        | 상태                                       |
| ----------------------------------------- | ------------------------------------------- | ------------------------------------------ |
| Migration verification runbook            | operator doc 한국어                         | `[x]` impl 2026-07-08                      |
| 3 approval gates                          | contract + E0 templates                     | `[x]` impl 2026-07-08                      |
| 8-step apply ladder                       | contract + 본 doc                           | `[x]` impl 2026-07-08                      |
| Bypass deny ≥6                            | contract `TRADE_DESK_MIGRATION_BYPASS_DENY` | `[x]` impl 2026-07-08                      |
| E0 P4 slot                                | `migration-verify-ladder.md`                | `[x]` impl 2026-07-08                      |
| Operator 서면 + auditor (실 migration 시) | signoff + review templates                  | `[ ]` pending — **migration touch 시에만** |

**Implemented:**

```text
gate:ai-impl --test apps/web/src/domain/__tests__/trade-desk-migration-verify-display-contract.test.ts green
```

**Verified:**

```text
Pending: git push → GitHub Actions quality green
Pending: 실제 migration touch 시 operator signoff + security-auditor PASS 행 작성
```
