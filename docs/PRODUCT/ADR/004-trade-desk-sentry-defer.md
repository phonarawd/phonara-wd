# ADR-004: Trade Desk Sentry / APM Defer (P4-B)

> **상태:** Accepted (defer) · **날짜:** 2026-07-08  
> **플랜:** Trade Desk Zero-Defect QA audit · todo `backlog-kpi-dashboard` (부록 C L2) · `p4-observability` (P4-B)  
> **Privacy SOT:** [`OBSERVABILITY_PRIVACY.md`](../../OBSERVABILITY_PRIVACY.md)  
> **Observability SOT:** [`TRADE_DESK_OBSERVABILITY.md`](../../OPERATIONS/TRADE_DESK_OBSERVABILITY.md)  
> **Contract:** [`trade-desk-observability-display-contract.ts`](../../../apps/web/src/domain/trade-desk-observability-display-contract.ts)

## Context

Trade desk P4-B requires **탐지 경로 문서화** and **운영 KPI 5종 정의** before launch. The web client already surfaces RPC failures via toast stable codes, fetch-error banner, and market-status banners. **Sentry browser SDK and third-party APM are not wired** — adding them introduces:

- External service dependency and DSN/key management
- Privacy review for money paths (balances, order sizes, wallet addresses)
- Bundle size and runtime overhead on 8GB operator baseline PCs

Engine edge observability (`edge-observability.ts`, `edge_ops_events`, `provider_health`) is **already shipped** (Engine Phase 6 CLOSED). The gap is **trade-desk-specific client telemetry aggregation**, not absence of all observability.

**엔진 경계:** 본 ADR은 **presentation/runtime telemetry wiring defer** — `supabase/migrations` · money RPC 변경 **0**.

## Decision

### 1. Defer Sentry / PostHog runtime SDK until post-L9 operator approval

- **Launch through L9:** rely on UI-visible signals + operator manual checklist + existing edge/DB soak paths.
- **Approval gate:** operator explicit signoff in `L9/release-approval-record.md` before any `@sentry/react` or PostHog init lands in `apps/web`.
- **Privacy:** any future SDK must follow [`OBSERVABILITY_PRIVACY.md`](../../OBSERVABILITY_PRIVACY.md) — no PII, balances, JWT, or admin reason text in events.

### 2. Accepted substitutes (P4-B · non-waivable until SDK)

| Layer             | Substitute                                                             |
| ----------------- | ---------------------------------------------------------------------- |
| Web client errors | Toast stable code registry · fetch-error banner · market-status banner |
| Submit path       | No silent RPC success (`trade-toast-display-contract`)                 |
| Operator          | 7-item manual incident checklist in `TRADE_DESK_OBSERVABILITY.md`      |
| Edge/DB           | `edge-observability.ts` · 24h soak spotcheck · CI advisors             |

### 3. KPI baseline without SDK

Five KPIs (Submit Success %, Wallet Refresh %, Realtime Disconnect %, Fetch Retry %, RPC Failure %) are **defined in contract** with `baseline: null` until operator post-deploy measurement. Metabase/Grafana dashboard is **post-L9 optional** (v6 L2 backlog) — not launch-blocking.

### 4. Future SDK scope (when approved)

```text
Allowed event names (examples): trade_submit_rpc_failed · trade_realtime_disconnect · trade_fetch_retry_ok
Forbidden payloads: user id · email · wallet balance · order size · JWT · full URL with tokens
Init: production build only · public DSN via env · no VITE_ service role
```

## Consequences

| Positive                                      | Negative                                              |
| --------------------------------------------- | ----------------------------------------------------- |
| No external telemetry dependency at Launch RC | No automatic crash grouping pre-L9                    |
| Privacy-by-default on money surfaces          | Operator manual checklist burden                      |
| Aligns with G13 CI-authoritative heavy gates  | KPI baseline requires deliberate operator measurement |

## Links

- Plan P4-B · v6 L2 운영 KPI backlog
- [`ENGINE_BOUNDARY.md`](../../SSOT/ENGINE_BOUNDARY.md) — UI display-only
- E0: [`P4/observability-kpi-baseline.md`](../../OPERATIONS/TRADE_DESK_ZERO_DEFECT_EVIDENCE/P4/observability-kpi-baseline.md)
