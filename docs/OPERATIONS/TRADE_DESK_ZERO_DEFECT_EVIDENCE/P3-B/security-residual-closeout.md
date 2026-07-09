# P3-B — Security Residual Closeout (S0 이후 · Launch RC advisory)

> **티어:** P3-B · **todo:** `p3-security-hardening`  
> **판정:** **PASS (Implemented)** 2026-07-08 — Launch RC §4E advisory 3건 중 **grants + T0-d** closeout · cross-user는 **S0 정본** (중복 없음)  
> **선행:** S0 PASS — [`../S0/security-auditor-delta.md`](../S0/security-auditor-delta.md)

---

## Scope (S0와 분리)

| 항목                         | S0                                            | P3-B            |
| ---------------------------- | --------------------------------------------- | --------------- |
| cross-user reject SQL        | ✅ `trade_cross_user_reject_test.sql`         | **재구현 금지** |
| idempotency duplicate SQL    | ✅ `hardening_test` · `spot_open_orders_test` | **재구현 금지** |
| P0 error surface scan        | ✅ vitest contract                            | **재구현 금지** |
| `grants_rls` entry/cron pins | advisory 잔여                                 | ✅ **본 티어**  |
| T0-d T1 settlement grep      | advisory 잔여                                 | ✅ **본 티어**  |

---

## Launch RC §4E advisory → closeout

| #   | Launch RC advisory (2026-07-07)                                                              | P3-B 액션                                                              | 결과                                     |
| --- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------- | ---------- |
| 1   | `grants_rls_inventory_test.sql` — `rpc_run_spot_order_fills` / `rpc_run_funding_accrual` pin | `grants_rls_inventory_test.sql` P3-B ASSERT 블록                       | **closed**                               |
| 2   | entry RPC pins (`open`/`close`/`spot market buy                                              | sell`)                                                                 | 동일 파일 explicit EXECUTE/REVOKE ASSERT | **closed** |
| 3   | T0-d grep allowlist — T1 settlement helper                                                   | `trade_t0d_candles_display_safety_test.sql` — `_fill_house_spot_order` | **closed**                               |
| 4   | cross-user negative SQL 1건                                                                  | S0 `trade_cross_user_reject_test.sql` (재착수 없음)                    | **S0 정본**                              |

---

## SQL pins (CI sql job authoritative)

```text
supabase/tests/grants_rls_inventory_test.sql
  — rpc_open_futures_position / rpc_close_futures_position
  — rpc_spot_market_buy|sell (4-arg + legacy 2-arg)
  — rpc_run_spot_order_fills / rpc_run_funding_accrual (service_role only)
  — _fill_house_spot_order REVOKE from authenticated

supabase/tests/trade_t0d_candles_display_safety_test.sql
  — settlement grep allowlist + _fill_house_spot_order (T1 house fill)
```

---

## Vitest contract pin

```text
Implemented: gate:ai-impl --test apps/web/src/domain/__tests__/trade-desk-security-display-contract.test.ts green
  — S0 block 10/10 + P3-B block 4/4
Verified:    CI sql job — grants_rls + trade_t0d after push
```

---

## P3-B DoD checklist

| #   | Criterion                                        | Result           |
| --- | ------------------------------------------------ | ---------------- |
| 1   | S0 본체 미중복 (cross-user·idempotency·error UI) | **PASS**         |
| 2   | grants_rls entry + cron worker pins              | **PASS**         |
| 3   | T0-d T1 settlement helper in grep allowlist      | **PASS**         |
| 4   | Launch RC §4E advisory → closed or S0 delegate   | **PASS**         |
| 5   | vitest P3-B contract block green                 | **PASS (local)** |

**P3-B Implemented:** operator push → CI sql/advisors Verified 대기
