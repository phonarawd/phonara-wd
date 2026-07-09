# Trade Desk — Perf Baseline (P3-A)

> **Plan:** Trade Desk Zero-Defect QA audit · **todo:** `p3-perf-benchmark`  
> **Gate:** hard metrics fail CI E2E · advisory metrics recorded in E0 snapshot  
> **E2E spec:** `tests/e2e/trade-desk-perf.spec.ts` · **contract:** `apps/web/src/domain/trade-desk-perf-display-contract.ts`

---

## Hard vs Advisory (v5 V2)

| 측정                          | Gate     | 합격 기준                                   | 근거                                                             |
| ----------------------------- | -------- | ------------------------------------------- | ---------------------------------------------------------------- |
| Chart tick FPS                | **hard** | avg ≥ **30** fps · desktop **5s** sample    | UX 신뢰 — frozen chart = mis-trade 리스크                        |
| Order ticket INP              | **hard** | **< 200** ms · press → disabled/`aria-busy` | 이중클릭 → 이중주문 즉시 차단                                    |
| **T1** Submit → RPC ack toast | **hard** | p95 ≤ **800** ms                            | money path · server authoritative ack                            |
| **T2** Ack → fills panel row  | advisory | p95 ≤ **2** s                               | P1-A realtime eventual consistency                               |
| **T3** Fill → wallet display  | advisory | p95 ≤ **3** s                               | `useWallet` invalidate · UI eventual (DB Σ=0은 별도 hard assert) |
| Cold `/trade` LCP             | advisory | **< 2.5** s · local stack                   | cold load — submit critical path 아님                            |

---

## E2E Latency chain 정의

```text
T0: submit button click
T1: success toast visible (RPC ack proxy)     — hard: p95(T1−T0) ≤ 800ms
T2: fill row in history panel                 — advisory: p95(T2−T1) ≤ 2s
T3: spot ticket avail balance text changes    — advisory: p95(T3−T2) ≤ 3s
```

**샘플 수:** 5회 spot market buy · p50/p95는 `summarizeLatencyChain()` (`tests/e2e/fixtures/trade-desk-perf.ts`)

**측정:** Playwright `page.evaluate(performance.now())` · trace attachment `p3-a-latency-chain-summary.json`

---

## 실행

```powershell
# Operator/CI (G13 — agent 로컬 heavy gate 자율 금지)
bun run test:e2e -- tests/e2e/trade-desk-perf.spec.ts

# Implemented closeout (contract + vitest wiring)
bun run gate:ai-impl -- --test apps/web/src/domain/__tests__/trade-desk-perf-display-contract.test.ts
```

**Verified:** GitHub Actions `e2e` job green · E0 [`P3-A/perf-baseline-snapshot.md`](TRADE_DESK_ZERO_DEFECT_EVIDENCE/P3-A/perf-baseline-snapshot.md)

---

## p50 / p95 기록 (CI 채움)

| Metric             | p50 | p95 | Gate             | Last CI run |
| ------------------ | --- | --- | ---------------- | ----------- |
| Chart FPS (5s avg) | —   | —   | hard ≥30         | pending     |
| Submit INP         | —   | —   | hard <200ms      | pending     |
| T1 Submit→Ack      | —   | —   | hard ≤800ms p95  | pending     |
| T2 Ack→Fill        | —   | —   | advisory ≤2s p95 | pending     |
| T3 Fill→Wallet     | —   | —   | advisory ≤3s p95 | pending     |
| Cold LCP `/trade`  | —   | —   | advisory <2.5s   | pending     |

> Operator: CI green 후 위 표를 E0 snapshot에 복사 · trace JSON 첨부 링크(GitHub artifact) 기록
