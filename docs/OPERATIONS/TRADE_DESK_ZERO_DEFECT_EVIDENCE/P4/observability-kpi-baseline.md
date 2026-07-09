# P4-B — Observability KPI baseline snapshot

> **Todo:** `backlog-kpi-dashboard` (부록 C L2) · `p4-observability` (P4-B) · Plan `trade_desk_qa_audit`  
> **Status:** `[x]` impl 2026-07-08 · baseline 값 · L9 signoff Verified pending

---

## Scope

| Item             | Value                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------- |
| Operator doc     | [`TRADE_DESK_OBSERVABILITY.md`](../../TRADE_DESK_OBSERVABILITY.md)                      |
| Sentry defer ADR | [`004-trade-desk-sentry-defer.md`](../../../PRODUCT/ADR/004-trade-desk-sentry-defer.md) |
| Contract         | `apps/web/src/domain/trade-desk-observability-display-contract.ts`                      |
| KPI count        | 5 (Submit · Wallet · Realtime · Fetch retry · RPC failure)                              |
| Detection layers | 4 (edge · db-rpc · web-client · operator)                                               |
| Manual checklist | 7 items (Sentry defer substitute)                                                       |

## DoD checklist (P4-B)

| 항목             | Gate                       | 상태                  |
| ---------------- | -------------------------- | --------------------- |
| 탐지 경로 문서화 | observability doc 4 layers | `[x]` impl 2026-07-08 |
| KPI 5행 정의     | contract matrix            | `[x]` impl 2026-07-08 |
| Sentry defer ADR | ADR-004                    | `[x]` impl 2026-07-08 |
| E0 P4 slot       | 본 파일                    | `[x]` impl 2026-07-08 |
| Baseline 값 1회  | operator post-deploy       | `[ ]` pending         |
| L9 signoff 행    | release-approval-record    | `[x]` impl 2026-07-08 |

## KPI baseline (operator fills post-deploy)

| KPI                   | baseline | target | measured_at | source                     |
| --------------------- | -------- | ------ | ----------- | -------------------------- |
| Submit Success %      | —        | —      | —           | toast registry · edge logs |
| Wallet Refresh %      | —        | —      | —           | trade-desk-perf T3 sample  |
| Realtime Disconnect % | —        | —      | —           | P3-C soak / session notes  |
| Fetch Retry %         | —        | —      | —           | manual checklist drill     |
| RPC Failure %         | —        | —      | —           | CI advisors · ops_alerts   |

## Implemented

```text
gate:ai-impl --test apps/web/src/domain/__tests__/trade-desk-observability-display-contract.test.ts green
```

## Verified

```text
Pending: git push → GitHub Actions quality green
Pending: operator KPI baseline 1회 측정 (post-deploy)
Linked: L9/release-approval-record.md Stage 2 observability row (impl 2026-07-08)
```
