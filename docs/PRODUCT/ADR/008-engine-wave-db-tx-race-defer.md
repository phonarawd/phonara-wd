# ADR-008: DB Transaction Race Deep Audit Defer (Engine Wave)

> **상태:** Proposed (defer stub) · **날짜:** 2026-07-08  
> **플랜:** Trade Desk Zero-Defect QA audit · todo `backlog-engine-adr` (부록 C L4 · §10 · §5 · DoD #4)  
> **SSOT:** [`ENGINE_BOUNDARY.md`](../../SSOT/ENGINE_BOUNDARY.md) §Engine Wave defer  
> **S0 evidence:** [`S0/security-auditor-delta.md`](../../OPERATIONS/TRADE_DESK_ZERO_DEFECT_EVIDENCE/S0/security-auditor-delta.md)

## Context

S0 Race 3분류 (v5 V3):

| 유형                    | 정의                                                   | S0 범위           |
| ----------------------- | ------------------------------------------------------ | ----------------- |
| **UI Race**             | double-click · rapid resubmit                          | ✅ 포함           |
| **RPC Race**            | 동일 idempotency_key 중복                              | ✅ 포함           |
| **DB Transaction Race** | 동시 TX가 동일 row/position 경합 (lock · SERIALIZABLE) | ⚠️ **S0 범위 밖** |

S0는 클라이언트·RPC·멱등성 negative에 집중한다. **DB TX race deep audit** 은 baseline SQL integration + Engine Wave에서 formalize한다.

> **S0 통과 ≠ DB TX deep concurrency audit 완료** — DoD #4 괄호 명시 (v7.1 F5)

**기존 baseline (partial pin):**

- [`conservation_test.sql`](../../../supabase/tests/conservation_test.sql) — GRAND_TOTAL · idempotency
- [`hardening_test.sql`](../../../supabase/tests/hardening_test.sql) — position cap · rate limit
- [`oi_cap_race_test.sql`](../../../supabase/tests/oi_cap_race_test.sql) — `_assert_position_limits` advisory xact lock · VOLATILE provolatile
- [`20260609000020_p1_position_oi_caps.sql`](../../../supabase/migrations/20260609000020_p1_position_oi_caps.sql) — per-user · OI cap

로컬 SQL runner는 **파일당 single backend** — multi-session 동시 TX 재현은 CI/engine soak 또는 Engine Wave 전용 harness.

## Decision

### 1. Defer DB TX race deep audit until Engine Wave

- **Launch through L9:** S0 UI/RPC race pins + baseline SQL (위) 유지.
- **금지:** S0 DoD에 DB TX race deep audit **혼입** · S0 PASS = DB concurrency 완료 **주장**.

### 2. Accepted substitutes (S0 · baseline SQL)

| 시나리오                | pin                                                |
| ----------------------- | -------------------------------------------------- |
| Duplicate idempotency   | `hardening_test` A4f · `spot_open_orders_test`     |
| UI double-submit        | `busy` + `openIdRef` contract                      |
| OI cap lock side effect | `oi_cap_race_test` — functiondef + live cap branch |
| Position limit          | `hardening_test` position_limit                    |
| Cross-user              | `trade_cross_user_reject_test.sql`                 |

### 3. Engine Wave 착수 조건 (when approved)

```text
1. 본 ADR Accepted + P4-D operator 서면 승인 (migration touch 시)
2. security-auditor concurrency review PASS
3. Deep audit scope 정의:
   - 동일 position row concurrent close/open
   - OI cap boundary under parallel opens (multi-backend harness)
   - wallet row lock ordering · deadlock regression
4. SQL: dedicated concurrency test file(s) or pgTAP multi-session CI job
5. db reset → test:sql → stack:push-remote → advisor 0
6. Residual: close/adjust/SLTP p_client_request_id gap (S0 advisory) — 본 wave 또는 UX slice
```

### 4. Explicit non-goals (Launch RC)

- SERIALIZABLE 전역 전환 (performance · liveness trade-off — 별도 ADR)
- Load test 100+ concurrent writers in prod (P3-C soak read-only)

## Consequences

| Positive                            | Negative                                     |
| ----------------------------------- | -------------------------------------------- |
| S0 scope 명확 · Launch RC 차단 없음 | Extreme concurrency edge 미검증              |
| Baseline locks/caps already shipped | Multi-session race harness deferred          |
| Idempotency + cross-user covered    | Operator "race" incident 시 manual DB review |

## Links

- Plan §5 Race 3분류 · §12 DoD #4 · v5 V3 · v7.1 F5
- [`TRADE_DESK_P0_CHECKLIST_1PAGE.md`](../../OPERATIONS/TRADE_DESK_P0_CHECKLIST_1PAGE.md) — S0 범위 밖 명시
- [`TRADE_DESK_MIGRATION_VERIFICATION.md`](../../OPERATIONS/TRADE_DESK_MIGRATION_VERIFICATION.md) — defer RED STOP
