# L9 — Release Approval Record (실질)

> **Plan:** `trade_desk_qa_audit` · **Todo:** `closeout-doc-sync` · **DoD:** §12 #13  
> **Status:** `[x]` **impl** 2026-07-08 · operator Verified **partial** (rollback dry-run · KPI baseline · Q1 operator 서명 대기)  
> **Zero-Defect 선언:** **금지** — §15 3m incident 0 전까지 ([`ops-window/`](../ops-window/README.md))

---

## 3단계 승인 (QA → Operator → Release)

| 단계                     | 담당                            | 산출                  | Agent Implemented | Operator Verified                                 |
| ------------------------ | ------------------------------- | --------------------- | ----------------- | ------------------------------------------------- |
| **1 · QA Verified**      | CI + §12 #0~12                  | 본 문서 §QA + E0 링크 | `[x]` 2026-07-08  | `[x]` 2026-07-07 (Launch RC 4C) · **L9 Q1 `[ ]`** |
| **2 · Operator Signoff** | rollback · soak · observability | E0 P4 + LAUNCH_RC     | `[x]` 2026-07-08  | **partial** — dry-run · KPI baseline `[ ]`        |
| **3 · Release**          | deploy sha + migration hash     | §Deploy log 1행       | `[x]` 2026-07-08  | `[ ]` prod deploy 확인 후                         |

---

## §QA Verified — §12 #0~12 + E0 실측

> **CI authoritative:** [`CI_GATE_AUTHORITY.md`](../../../SSOT/CI_GATE_AUTHORITY.md) · G13 agent 로컬 heavy 금지

### CI 4 job (Verified baseline)

| Job      | 상태        | 증거                                                                                                    |
| -------- | ----------- | ------------------------------------------------------------------------------------------------------- |
| quality  | `[x]` green | Launch RC 2026-07-07 · commit `fed305d` · branch `closeout/engine-apex-freeze-phase-r-ready-2026-07-03` |
| sql      | `[x]` green | Σ=0 · `test:sql` CI job                                                                                 |
| e2e      | `[x]` green | `trade-desk-smoke` + wallet/trade specs · HEAD `ae94979` E2E fix                                        |
| advisors | `[x]` green | 0 ERROR                                                                                                 |

**Actions URL (branch):**

```text
https://github.com/phonaralv/phonara-gb/actions?query=branch%3Acloseout%2Fengine-apex-freeze-phase-r-ready-2026-07-03
```

**로컬 확인:** `bun run ci:status` · push 후 Actions UI green = Verified

### §12 DoD #0~12 — E0 슬롯 매핑

| #   | 기준                      | E0 / 증거                                                                         | Agent      | Operator              |
| --- | ------------------------- | --------------------------------------------------------------------------------- | ---------- | --------------------- |
| 0   | Σ 정본 + Q1/Q2            | [`P0-0/`](../P0-0/0-A-quality-signoff.md)                                         | `[x]`      | Q1 `[ ]` · Q2 `[x]`   |
| 0b  | Wallet ⊄ Accounting       | [`MONEY_CONSERVATION_FORMULA.md`](../../../SSOT/MONEY_CONSERVATION_FORMULA.md) §2 | `[x]`      | `[x]` read-only       |
| 1   | dead handler 0            | Launch RC §4A · action-path contract                                              | `[x]`      | `[x]` 2026-07-07      |
| 2   | silent · tier-blind 0     | P0 contracts · P0-4 tier                                                          | `[x]` impl | CI e2e                |
| 3   | Σ=0 flat                  | `conservation_test.sql` · CI sql                                                  | `[x]`      | `[x]` CI              |
| 4   | security + concurrency    | [`S0/`](../S0/security-auditor-delta.md) · P3-B                                   | `[x]`      | CI sql/advisors       |
| 5   | console warn ≤5           | P1-F allowlist · CI e2e                                                           | `[x]` impl | CI                    |
| 6   | house counterparty ack    | P2-D confirm gate                                                                 | `[x]` impl | vitest                |
| 7   | INP + ack latency         | [`P3-A/`](../P3-A/perf-baseline-snapshot.md)                                      | `[x]` impl | CI/defer              |
| 8   | axe critical 0            | visual signoff · P3-D browser matrix                                              | `[x]` impl | operator axe advisory |
| 9   | advisor ERROR 0           | CI advisors                                                                       | `[x]`      | `[x]` CI              |
| 10  | soak WARNING 0            | Launch RC §4D · P3-C                                                              | `[x]`      | `[x]` 2026-07-07      |
| 11  | failure+chaos+freeze      | [`P4/failure-recovery-matrix.md`](../P4/failure-recovery-matrix.md)               | `[x]` impl | drill `[ ]`           |
| 12  | rollback + version matrix | [`P4/rollback-dry-run-2026-07-08.md`](../P4/rollback-dry-run-2026-07-08.md)       | `[x]` impl | dry-run `[ ]`         |

### L9 QA 필수 체크박스 (F1 · post-P0-0)

- [ ] **Q1** manual diff operator 서명 ([`0-A-quality-signoff.md`](../P0-0/0-A-quality-signoff.md))
- [x] **Q2** `check:money-formula-citations` green (agent + CI quality job)
- [x] CI 4 job green (Launch RC Verified 2026-07-07 + HEAD `ae94979` e2e fixes)

---

## §Operator Signoff

| 항목                       | E0 / doc                                                                      | Agent           | Operator           |
| -------------------------- | ----------------------------------------------------------------------------- | --------------- | ------------------ |
| Launch RC S4               | [`TRADE_DESK_LAUNCH_RC_SIGNOFF.md`](../../TRADE_DESK_LAUNCH_RC_SIGNOFF.md) §E | —               | `[x]` 2026-07-07   |
| 24h prod soak              | §4D spot-check WARNING 0                                                      | `[x]` script    | `[x]` 2026-07-07   |
| Rollback 15min dry-run     | [`P4/rollback-dry-run-2026-07-08.md`](../P4/rollback-dry-run-2026-07-08.md)   | `[x]` checklist | `[ ]` **pending**  |
| Failure matrix drill       | [`P4/failure-recovery-matrix.md`](../P4/failure-recovery-matrix.md)           | `[x]`           | freeze drill `[ ]` |
| Observability KPI baseline | [`P4/observability-kpi-baseline.md`](../P4/observability-kpi-baseline.md)     | `[x]` 정의      | baseline 1회 `[ ]` |
| Sentry defer ADR-004       | [`ADR-004`](../../../PRODUCT/ADR/004-trade-desk-sentry-defer.md)              | `[x]`           | L9 승인 `[ ]`      |
| Migration P4-D ladder      | [`P4/migration-verify-ladder.md`](../P4/migration-verify-ladder.md)           | `[x]`           | touch 시만         |

**Operator 서명 (Stage 2):**

```text
Stage 2 Operator Signoff: ( ) APPROVED  ( ) HOLD — rollback dry-run / KPI baseline 미완
서명: ________________  날짜: __________
```

---

## §Release — Deploy log 1행 (DoD #13)

> 정본: [`TRADE_DESK_RELEASE_ROLLBACK_RUNBOOK.md`](../../TRADE_DESK_RELEASE_ROLLBACK_RUNBOOK.md) §Deploy log

| deployed_at (UTC+9) | frontend_sha | migration_list_hash                                            | verdict       | operator   | notes                                            |
| ------------------- | ------------ | -------------------------------------------------------------- | ------------- | ---------- | ------------------------------------------------ |
| 2026-07-08          | `ae94979`    | `6b41190fa972caf2` (204 migrations · `check:migrations` green) | **SUPPORTED** | agent impl | L9 baseline row · prod deploy operator 확인 대기 |
| 2026-07-07          | `fed305d`    | parity                                                         | **SUPPORTED** | operator   | Launch RC 4C Verified                            |

**Compatibility:** frontend-only delta P0~P4 · migration touch **0** · [`migration-verify-ladder.md`](../P4/migration-verify-ladder.md) 미적용

**Stage 3 Release 서명:**

```text
Stage 3 Release: ( ) APPROVED  ( ) HOLD
Deploy sha confirmed: __________  날짜: __________
```

---

## §15 운영 창 시작 (DoD #14)

> **시작일:** 2026-07-08 · **Zero-Defect 선언 금지** — 3m 누적 incident 0 후에만 "근접" 검토

| 창        | 종료 목표  | 기록                                              | 상태        |
| --------- | ---------- | ------------------------------------------------- | ----------- |
| **1주**   | 2026-07-15 | [`ops-window/week1.md`](../ops-window/week1.md)   | **STARTED** |
| **1개월** | 2026-08-08 | [`ops-window/month1.md`](../ops-window/month1.md) | **STARTED** |
| **3개월** | 2026-10-08 | [`ops-window/month3.md`](../ops-window/month3.md) | **STARTED** |

**Incident 정의:** wallet Σ drift · duplicate submit ledger · unauthorized RPC · operator-triggered rollback  
**실패 시:** [`ops-window/README.md`](../ops-window/README.md) §15 (a)~(e) · `incident-YYYY-MM-DD.md`

---

## Implemented (L9 closeout)

```text
closeout-doc-sync: L9 release-approval-record (실질) + ops-window STARTED + §82 ACTIVE_WORK_SSOT sync
E0 README L9 슬롯 갱신 · LAUNCH_RC §L9 cross-ref
```

## Verified (operator / CI)

```text
Pending: Stage 2 rollback 15min dry-run 서명
Pending: Stage 2 KPI baseline 1회 (post-deploy)
Pending: Stage 3 prod deploy sha operator 확인
Pending: §15 week1 PASS (2026-07-15) · month1 (2026-08-08) · month3 (2026-10-08)
```
