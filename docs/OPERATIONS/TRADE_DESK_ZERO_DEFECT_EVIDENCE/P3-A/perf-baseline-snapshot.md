# P3-A — Perf Baseline Snapshot (E0)

> **티어:** P3-A · **todo:** `p3-perf-benchmark`  
> **정본:** [`TRADE_DESK_PERF_BASELINE.md`](../TRADE_DESK_PERF_BASELINE.md)  
> **상태:** `[x]` **impl** 2026-07-08 · CI e2e Verified **pending**

---

## Implemented

| 항목                | 증거                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------- |
| Contract thresholds | `apps/web/src/domain/trade-desk-perf-display-contract.ts`                                    |
| Vitest wiring       | `gate:ai-impl --test apps/web/src/domain/__tests__/trade-desk-perf-display-contract.test.ts` |
| E2E spec            | `tests/e2e/trade-desk-perf.spec.ts`                                                          |
| Fixtures            | `tests/e2e/fixtures/trade-desk-perf.ts`                                                      |

---

## CI 실측 (push 후 채움)

```text
Spec: tests/e2e/trade-desk-perf.spec.ts
Run:  gh run list --workflow=ci.yml --limit 3
Trace: GitHub Actions → e2e job → playwright-report artifact (failure 시)
Attachment: p3-a-latency-chain-summary.json (spec 내 test.info().attach)
```

| Metric         | p50 | p95 | Gate             | Pass    |
| -------------- | --- | --- | ---------------- | ------- |
| Chart FPS      | —   | —   | hard ≥30 avg     | pending |
| Submit INP     | —   | —   | hard <200ms      | pending |
| T1 Submit→Ack  | —   | —   | hard ≤800ms p95  | pending |
| T2 Ack→Fill    | —   | —   | advisory ≤2s p95 | pending |
| T3 Fill→Wallet | —   | —   | advisory ≤3s p95 | pending |
| Cold LCP       | —   | —   | advisory <2.5s   | pending |

---

## Hard/Advisory 근거 (1줄)

- **Hard (money/submit/chart):** mis-trade · duplicate order · frozen chart = 즉시 사용자 손실 경로
- **Advisory (display eventual):** P1-A fill realtime · `useWallet` invalidate — DB Σ=0은 smoke/ SQL에서 별도 hard assert
