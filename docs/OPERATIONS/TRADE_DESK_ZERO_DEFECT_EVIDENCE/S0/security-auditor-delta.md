# S0 — Security Auditor Delta (P0 직후)

> **티어:** S0 · **todo:** `s0-security-gate`  
> **판정:** **PASS** (2026-07-08) — P0 error surface clean · cross-user + idempotency SQL pinned  
> **DB TX Race:** §5 범위 외 — Engine Wave defer ([ADR-008](../../PRODUCT/ADR/008-engine-wave-db-tx-race-defer.md)) · S0 통과 ≠ deep DB concurrency audit

---

## Auditor summary

| 항목                                   | RISK                   | 판정                                                                    |
| -------------------------------------- | ---------------------- | ----------------------------------------------------------------------- |
| P0 error surface (banner/status/toast) | NONE                   | **PASS** — i18n keys only · `translateError` → `error.UNKNOWN` fallback |
| Cross-user trade RPC reject            | MEDIUM → **mitigated** | **PASS** — `trade_cross_user_reject_test.sql` pinned                    |
| Duplicate idempotency                  | NONE                   | **PASS** — `hardening_test` A4f + `spot_open_orders_test`               |
| UI double-submit gate                  | LOW                    | **PASS** — `openIdRef`/`buyIdRef` + `busy` + submit gate                |
| RLS/GRANT inventory (entry RPCs)       | LOW                    | **advisory** — `grants_rls_inventory_test` partial; anon lockdown OK    |

**Overall RISK:** LOW (no CRITICAL/HIGH open on P0 delta)

---

## Scope A — 정보 노출 (P0-1~P0-4)

| Surface               | 검증                                        | 근거                                                       |
| --------------------- | ------------------------------------------- | ---------------------------------------------------------- |
| Fetch error banner    | 고정 키 `trade.dataStatus.errorDescription` | `trade-desk-fetch-error-banner.tsx:40`                     |
| Market status banner  | `titleKey`/`descriptionKey` only            | `trade-market-status-banner.tsx:78-84`                     |
| RPC submit errors     | `translateError` → `MessageKey` → toast     | `use-trading.ts` catch · `trade-feedback-display.ts:77-86` |
| P0-4 tier blind claim | `tierError` → claim/unstake disabled        | `trade-submit-display-contract.ts:343-356`                 |

**Vitest pin:** `apps/web/src/domain/__tests__/trade-desk-security-display-contract.test.ts`  
**Vitest pin:** `apps/web/src/features/trading/__tests__/trade-feedback-display.test.ts` (raw PostgREST → `error.UNKNOWN`)

---

## Scope B — Cross-user reject (≥1)

| 시나리오                          | RPC                          | 기대        | SQL pin                            |
| --------------------------------- | ---------------------------- | ----------- | ---------------------------------- |
| User A position · User B close    | `rpc_close_futures_position` | `forbidden` | `trade_cross_user_reject_test.sql` |
| User A spot order · User B cancel | `rpc_cancel_spot_order`      | `forbidden` | 동일 파일                          |

**Engine guard (unchanged):** `20260609000009_p0_auto_liquidation.sql:472` `IF v_pos.user_id <> v_user_id THEN RAISE EXCEPTION 'forbidden'`

---

## Scope C — Idempotency / UI race

| 유형              | 검증                                                                                            | pin                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **RPC duplicate** | 동일 `p_client_request_id` 2회 → `duplicate_request` · 1 position/order                         | `hardening_test.sql` A4f · `spot_open_orders_test.sql:61-72` |
| **UI race**       | `openIdRef`/`buyIdRef`/`sellIdRef` hold one req id per in-flight submit; `busy` disables ticket | `use-trading.ts:1072-1113` · contract test                   |
| **Replay (JWT)**  | `auth.uid()` NULL → `UNAUTHENTICATED` on trade RPCs                                             | engine baseline · `anon_lockdown_test.sql`                   |
| **DB TX Race**    | —                                                                                               | **S0 범위 밖** · `conservation_test.sql` · Engine Wave       |

---

## Race 3분류 (v5 V3)

| 유형                | S0                                   |
| ------------------- | ------------------------------------ |
| UI Race             | ✅ `busy` + idempotency ref contract |
| RPC Race            | ✅ SQL duplicate_request pins        |
| DB Transaction Race | ⚠️ defer Engine Wave                 |

---

## Gates

```text
Implemented: gate:ai-impl --test apps/web/src/domain/__tests__/trade-desk-security-display-contract.test.ts green · vitest 10/10
Implemented: gate:ai-impl --test apps/web/src/features/trading/__tests__/trade-feedback-display.test.ts green
Verified:    CI sql job — trade_cross_user_reject_test.sql + hardening A4f + spot_open_orders (push 후)
Verified:    CI advisors job ERROR 0 (unchanged by P0 UI-only delta)
```

---

## Residual advisory (non-blocking)

1. ~~`grants_rls_inventory_test.sql` — extend pins for entry RPCs + cron workers~~ → **P3-B closed 2026-07-08** — [`../P3-B/security-residual-closeout.md`](../P3-B/security-residual-closeout.md)
2. Close/adjust/SLTP paths lack `p_client_request_id` — money-safe via server state; UX-only duplicate toast risk (Engine Wave defer)

---

## S0 DoD checklist

| #   | Criterion                    | Result                                        |
| --- | ---------------------------- | --------------------------------------------- |
| 1   | ERROR 0 (CRITICAL/HIGH)      | **PASS**                                      |
| 2   | cross-user reject ≥1 SQL     | **PASS** — `trade_cross_user_reject_test.sql` |
| 3   | duplicate idempotency ≥1 SQL | **PASS** — A4f + spot_open_orders             |
| 4   | P0 error UI raw RPC = 0      | **PASS**                                      |
| 5   | DB TX Race explicit defer    | **PASS** — 본 문서 §Race 3분류                |

**S0 DoD: PASS** — P1/P2 진행 허용
