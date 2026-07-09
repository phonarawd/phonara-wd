# Trade Desk — Failure Recovery Matrix (P4-A)

> **Todo:** `p4-failure-recovery` · Plan `trade_desk_qa_audit` P4-A  
> **Status:** `[x]` impl 2026-07-08 · operator dry-run Verified pending  
> **교차:** [`TRADE_DESK_T0_ORACLE_OPS_RUNBOOK.md`](TRADE_DESK_T0_ORACLE_OPS_RUNBOOK.md) §7 · E0 [`P4/failure-recovery-matrix.md`](TRADE_DESK_ZERO_DEFECT_EVIDENCE/P4/failure-recovery-matrix.md)

---

## 목적

Trade desk 장애 시 **UI 방어 → operator 확인 → 복구** 경로를 Tier별로 고정한다.  
**Oracle lag**(updated_at 지연)와 **Oracle freeze**(mark ≥60s 무변동 · feed alive)를 분리한다.

**코드 정본:** [`trade-desk-failure-recovery-display-contract.ts`](../../apps/web/src/domain/trade-desk-failure-recovery-display-contract.ts)

---

## Tier 1 — 기본 (Visible + recovery)

| 시나리오                     | UI 방어                                     | 검증                                    |
| ---------------------------- | ------------------------------------------- | --------------------------------------- |
| **DB/PostgREST unreachable** | `trade-desk-fetch-error-banner` + retry     | vitest mock · fetch-error contract      |
| **Realtime channel down**    | disconnect banner · submit block            | vitest reconnect · oracle realtime hook |
| **RPC timeout / 5xx**        | toast stable code                           | i18n audit · toast registry             |
| **browser offline**          | `navigator.onLine` gate                     | Playwright offline (CI e2e advisory)    |
| **partial stale price**      | per-symbol stale banner · submit-only block | market-status + submit contract         |

**Operator 1페이지:** fetch retry → realtime 재연결 대기 → RPC 재시도. **새 RPC/엔진 변경 금지.**

---

## Tier 2 — 복합 Chaos (v4 E2)

| 시나리오                             | 기대 UI                                                                       | 검증                                   |
| ------------------------------------ | ----------------------------------------------------------------------------- | -------------------------------------- |
| **Partial fill mid disconnect**      | partial fills 표시 + disconnect banner · submit blocked · reconnect 후 일관   | load-realtime contract · E2E mock (CI) |
| **Duplicate submit (network retry)** | idempotency → single ledger leg · already-processed 또는 silent dedup         | S0 SQL · `hardening_test`              |
| **Retry storm**                      | submit lock · backoff · graceful degrade                                      | vitest · P3-C soak advisory            |
| **Clock drift**                      | stale gate · server `updated_at` authoritative                                | chart-mount contract                   |
| **Oracle lag**                       | `updated_at` > threshold · **stale** banner · submit block                    | E8 browser matrix                      |
| **Price feed freeze (v5 V5)**        | oracle **alive** · mark **≥60s unchanged** · **freeze** banner · submit block | failure-recovery contract              |
| **Redis/cache delay**                | **N/A** — trade path Redis 없음 · P0 fetch error                              | 본 표 명시                             |

---

## Oracle lag vs freeze (operator 분류)

| 구분       | DB/클라이언트 신호                                           | UI                         | Submit                | T0 runbook       |
| ---------- | ------------------------------------------------------------ | -------------------------- | --------------------- | ---------------- |
| **Lag**    | `oracle_prices.updated_at` age **> 300s** (symbol threshold) | `trade.dataStatus.stale*`  | block · stale reason  | §2.1 stale audit |
| **Freeze** | age **≤ 300s** but mark value **≥60s unchanged**             | `trade.dataStatus.freeze*` | block · freeze reason | §7 freeze vs lag |

> 차트는 mount 가능해도 freeze/lag 시 submit block — T0-d display vs settlement 경계 유지.

---

## Oracle Freeze 인시던트 에스컬레이션 (v7 · operator 1인)

| 단계       | 담당                          | SLA      | 확인 위치                                                                                 | 액션                                      |
| ---------- | ----------------------------- | -------- | ----------------------------------------------------------------------------------------- | ----------------------------------------- |
| **1 탐지** | 자동 UI banner + soak WARNING | 즉시     | `trade-market-status-banner` · soak SQL                                                   | submit block 유지 · false urgency 금지    |
| **2 확인** | **operator**                  | **15분** | Supabase `oracle_prices.updated_at` · [T0 §1.3 · §7](TRADE_DESK_T0_ORACLE_OPS_RUNBOOK.md) | freeze vs lag 분류                        |
| **3 승인** | operator (1인 운영)           | 30분     | E0 `P4/incident-YYYY-MM-DD.md`                                                            | oracle cron/edge 재기동 · T0 §2.2         |
| **4 공지** | operator 판단                 | 필요 시  | i18n `trade.dataStatus.freeze*`                                                           | eligibility-visible만 · 과장 urgency 금지 |

**§15 운영 창 incident:** Money/Security 해당 시 [`TRADE_DESK_ZERO_DEFECT_EVIDENCE/README.md`](TRADE_DESK_ZERO_DEFECT_EVIDENCE/README.md) `ops-window/incident-*.md` + (a)~(e) 복구 절차 · (e) rollback → [`TRADE_DESK_RELEASE_ROLLBACK_RUNBOOK.md`](TRADE_DESK_RELEASE_ROLLBACK_RUNBOOK.md) P4-C.

---

## Implemented evidence

```text
gate:ai-impl --test apps/web/src/domain/__tests__/trade-desk-failure-recovery-display-contract.test.ts green
```

**Verified:** GitHub CI quality job green after push · operator freeze dry-run 1회 (선택)

---

## 교차 참조

- [`TRADE_DESK_T0_ORACLE_OPS_RUNBOOK.md`](TRADE_DESK_T0_ORACLE_OPS_RUNBOOK.md) — oracle freshness · PHON cron
- [`TRADE_DESK_LOAD_REALTIME_SOAK.md`](TRADE_DESK_LOAD_REALTIME_SOAK.md) — disconnect false-positive DoD
- [`TRADE_DESK_LAUNCH_RC_SIGNOFF.md`](TRADE_DESK_LAUNCH_RC_SIGNOFF.md) — Launch RC baseline
- [`TRADE_DESK_RELEASE_ROLLBACK_RUNBOOK.md`](TRADE_DESK_RELEASE_ROLLBACK_RUNBOOK.md) — release/rollback · version compatibility (P4-C)
- [`../SSOT/CI_GATE_AUTHORITY.md`](../SSOT/CI_GATE_AUTHORITY.md) — heavy gate CI authoritative (G13)
