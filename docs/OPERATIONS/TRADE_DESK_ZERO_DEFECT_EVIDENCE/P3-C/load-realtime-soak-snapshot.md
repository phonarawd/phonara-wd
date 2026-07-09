# P3-C — Load / Realtime Soak Snapshot (E0)

> **티어:** P3-C · **todo:** `p3-load-realtime`  
> **정본:** [`TRADE_DESK_LOAD_REALTIME_SOAK.md`](../../TRADE_DESK_LOAD_REALTIME_SOAK.md)  
> **상태:** `[x]` **impl** 2026-07-08 · operator soak / prod spotcheck Verified **pending**

---

## Implemented

| 항목                                      | 증거                                                                                                  |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Channel tiers 10/50/100 + gate invariants | `apps/web/src/domain/trade-desk-load-realtime-display-contract.ts`                                    |
| Vitest wiring                             | `gate:ai-impl --test apps/web/src/domain/__tests__/trade-desk-load-realtime-display-contract.test.ts` |
| Realtime soak script (read-only)          | `scripts/trade-desk-realtime-load-soak.ts`                                                            |
| Prod spotcheck extension                  | `scripts/trade-desk-launch-rc-soak-spotcheck.sql` P3-C block                                          |

---

## DoD checklist

| #   | 기준                                                       | 결과                         |
| --- | ---------------------------------------------------------- | ---------------------------- |
| 1   | disconnect banner false-positive 0 (subscribed/connecting) | **PASS (vitest pure)**       |
| 2   | submit gate false-positive 0 (healthy oracle)              | **PASS (vitest pure)**       |
| 3   | prod spotcheck read-only · write 0                         | **PASS (SQL SELECT only)**   |
| 4   | N-channel soak script 10/50/100                            | **PASS (script + contract)** |

---

## Operator 실측 (push 후 채움)

```text
Realtime soak: bun run trade-desk:realtime-soak
Prod spotcheck: psql $DATABASE_URL -f scripts/trade-desk-launch-rc-soak-spotcheck.sql
JSON: p3c-realtime-soak summary pass=true all tiers
```

| Tier | subscribed/total | channel_errors | oracle_events | pass    |
| ---- | ---------------- | -------------- | ------------- | ------- |
| 10   | —                | —              | —             | pending |
| 50   | —                | —              | —             | pending |
| 100  | —                | —              | —             | pending |

| Spotcheck        | WARNING count | Last run |
| ---------------- | ------------- | -------- |
| P3-C burst block | —             | pending  |

**P3-C Implemented:** operator push → prod spotcheck WARNING 0 + soak JSON pass = Verified
