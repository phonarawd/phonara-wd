# Trade Desk — Observability + 운영 KPI (P4-B)

> **Todo:** `backlog-kpi-dashboard` (부록 C L2) · `p4-observability` (P4-B) · Plan `trade_desk_qa_audit` · v6 L2  
> **Status:** `[x]` impl 2026-07-08 · KPI baseline 값 채움 = post-deploy · L9 signoff pending  
> **코드 정본:** [`trade-desk-observability-display-contract.ts`](../../apps/web/src/domain/trade-desk-observability-display-contract.ts)  
> **Sentry defer:** [`ADR-004`](../PRODUCT/ADR/004-trade-desk-sentry-defer.md) · [`OBSERVABILITY_PRIVACY.md`](../OBSERVABILITY_PRIVACY.md)

---

## 목적

Trade desk 장애·품질을 **탐지 → 분류 → operator 확인**할 수 있도록 계층별 경로와 **운영 KPI 5종**을 정의한다.  
**대시보드·Sentry SDK 구현은 출시 차단 아님** — 본 문서는 정의·수동 체크리스트·E0 baseline 슬롯만 먼저 고정한다.

---

## 탐지 계층 (4 layers)

| 계층           | 현재 자산                                                                                                                                      | 갭                                      | 액션                                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------- |
| **Edge**       | [`edge-observability.ts`](../../supabase/functions/_shared/edge-observability.ts)                                                              | trade desk 전용 dashboard 없음          | soak · ops runbook · `edge_ops_events` read-only spotcheck |
| **DB/RPC**     | 24h soak · [`trade-desk-launch-rc-soak-spotcheck.sql`](../../scripts/trade-desk-launch-rc-soak-spotcheck.sql)                                  | trade RPC SLO aggregate view 없음       | P3-C load/realtime soak · CI sql · advisors                |
| **Web client** | RPC error → toast stable code · [`trade-desk-fetch-error-banner`](../../apps/web/src/product/surfaces/trade/trade-desk-fetch-error-banner.tsx) | Sentry/APM runtime SDK 0                | ADR-004 defer + 아래 **수동 incident checklist**           |
| **Operator**   | [`TRADE_DESK_T0_ORACLE_OPS_RUNBOOK.md`](TRADE_DESK_T0_ORACLE_OPS_RUNBOOK.md)                                                                   | Zero-Defect L9 observability signoff 행 | L9 `release-approval-record` · KPI baseline 1회 측정       |

---

## 운영 KPI 5종 (v6 L2)

> **값 채움:** 배포 후 operator 1회 baseline 측정 → E0 [`P4/observability-kpi-baseline.md`](TRADE_DESK_ZERO_DEFECT_EVIDENCE/P4/observability-kpi-baseline.md)

| KPI                       | 정의                                                  | 산식                          | 목표 소스 (측정)                                        | baseline | target |
| ------------------------- | ----------------------------------------------------- | ----------------------------- | ------------------------------------------------------- | -------- | ------ |
| **Submit Success %**      | trade submit RPC success / attempts (spot + futures)  | success / attempts × 100      | edge-observability · toast stable code · toast registry | —        | —      |
| **Wallet Refresh %**      | fill 후 wallet query가 **3s** 이내 성공               | within_sla / fills × 100      | P3-A E2E T3 · `useWallet` invalidate                    | —        | —      |
| **Realtime Disconnect %** | oracle_prices 채널 disconnect session / total session | disconnect / sessions × 100   | P3-C soak · market-status banner · realtime hook        | —        | —      |
| **Fetch Retry %**         | fetch error banner → retry 성공 (full reload 없이)    | retry_ok / fetch_errors × 100 | P0-1 fetch-error banner (telemetry defer)               | —        | —      |
| **RPC Failure %**         | trade RPC 5xx · timeout · PostgREST error / calls     | failures / calls × 100        | CI advisors · edge logs · `ops_alerts`                  | —        | —      |

**Wallet Refresh SLA:** P3-A T3 advisory와 동일 **3000ms** — [`trade-desk-perf-display-contract.ts`](../../apps/web/src/domain/trade-desk-perf-display-contract.ts)

---

## Sentry / APM defer (요약)

| 항목                      | 판정                                                                              |
| ------------------------- | --------------------------------------------------------------------------------- |
| Sentry browser SDK        | **Deferred** post-L9 · operator 승인 후                                           |
| PostHog product analytics | **Deferred** · [`OBSERVABILITY_PRIVACY.md`](../OBSERVABILITY_PRIVACY.md)          |
| 대체 (Launch ~ L9)        | 아래 **수동 incident checklist** + toast/fetch/market-status UI                   |
| ADR                       | [`004-trade-desk-sentry-defer.md`](../PRODUCT/ADR/004-trade-desk-sentry-defer.md) |

---

## 수동 incident checklist (Sentry defer 대체)

배포 후 trade path incident 시 operator가 **순서대로** 확인:

<!-- prettier-ignore-start -->

1. Browser DevTools console — uncaught errors on /trade · /trade/futures submit path
2. Network tab — trade rpc\_\* 4xx/5xx · PostgREST timeout · duplicate idempotency
3. Toast stable code — no silent RPC success (trade-toast registry)
4. trade-desk-fetch-error banner — retry clears without hard refresh
5. trade-market-status banner — disconnect/stale/freeze vs lag classification
6. 24h soak spotcheck — oracle age · cron health · ops_alerts critical 0
7. edge_ops_events read-only — provider_health degraded/unavailable rows
<!-- prettier-ignore-end -->

**교차:** [`TRADE_DESK_FAILURE_RECOVERY_MATRIX.md`](TRADE_DESK_FAILURE_RECOVERY_MATRIX.md) Tier1 · [`TRADE_DESK_T0_ORACLE_OPS_RUNBOOK.md`](TRADE_DESK_T0_ORACLE_OPS_RUNBOOK.md)

---

## DoD (P4-B)

| 항목                     | Gate                               | 상태                  |
| ------------------------ | ---------------------------------- | --------------------- | ----------------------- |
| 탐지 경로 4계층 문서화   | 본 문서 §탐지 계층                 | `[x]` impl 2026-07-08 |
| KPI 표 5행 정의          | contract `TRADE_DESK_KPI_MATRIX`   | `[x]` impl 2026-07-08 |
| Sentry defer ADR         | ADR-004 + privacy cross-ref        | `[x]` impl 2026-07-08 |
| E0 P4 slot               | `P4/observability-kpi-baseline.md` | `[x]` impl 2026-07-08 |
| KPI baseline 값          | operator post-deploy 1회           | `[ ]` pending         |
| L9 observability signoff | `L9/release-approval-record.md`    | `[x]` impl 2026-07-08 | operator baseline `[ ]` |

---

## Implemented

```text
gate:ai-impl --test apps/web/src/domain/__tests__/trade-desk-observability-display-contract.test.ts green
```

---

## L9 signoff 행 (템플릿)

| 항목                      | Agent Implemented | Operator Verified          |
| ------------------------- | ----------------- | -------------------------- |
| P4-B KPI 5종 정의         | `[x]` 2026-07-08  | `[ ]` post-deploy baseline |
| Sentry defer ADR-004      | `[x]` 2026-07-08  | `[ ]` L9 Stage 2 operator  |
| Manual incident checklist | `[x]` 2026-07-08  | `[ ]` 1회 drill            |

---

## 부록 C L2 — KPI 대시보드 백로그 (post-L9)

| 항목                      | 상태              | 비고                                             |
| ------------------------- | ----------------- | ------------------------------------------------ |
| KPI 5종 **정의**          | `[x]` 2026-07-08  | 본 문서 + contract `TRADE_DESK_KPI_MATRIX`       |
| Baseline 값 1회 측정      | `[ ]` post-deploy | operator → E0 `P4/observability-kpi-baseline.md` |
| Metabase/Grafana 대시보드 | `[ ]` post-L9     | Sentry/APM SDK 승인 후 optional                  |

**Plan todo:** `backlog-kpi-dashboard` · **구현 todo:** `p4-observability`

---

## 교차 참조

- [`TRADE_DESK_PERF_BASELINE.md`](TRADE_DESK_PERF_BASELINE.md) — T1/T2/T3 latency · wallet refresh SLA
- [`TRADE_DESK_LOAD_REALTIME_SOAK.md`](TRADE_DESK_LOAD_REALTIME_SOAK.md) — disconnect soak
- [`TRADE_DESK_LAUNCH_RC_SIGNOFF.md`](TRADE_DESK_LAUNCH_RC_SIGNOFF.md) — 24h soak · CI authoritative
- E0: [`TRADE_DESK_ZERO_DEFECT_EVIDENCE/P4/observability-kpi-baseline.md`](TRADE_DESK_ZERO_DEFECT_EVIDENCE/P4/observability-kpi-baseline.md)
