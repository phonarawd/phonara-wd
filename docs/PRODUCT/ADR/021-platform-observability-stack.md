# ADR-021: Platform Observability / Alert / Tracing Stack (R0)

> **상태:** Accepted (launch minimum) · **날짜:** 2026-07-13  
> **플랜:** `platform-perfect-launch` · todo `audit-r0-control-plane`  
> **선행:** ADR-004 Trade Desk Sentry defer · [`TRADE_DESK_OBSERVABILITY.md`](../../OPERATIONS/TRADE_DESK_OBSERVABILITY.md)  
> **후행:** R4 관측 구축·alert dry-fire · Finding `EXT-01` · `H-04`  
> **Privacy:** [`OBSERVABILITY_PRIVACY.md`](../../OBSERVABILITY_PRIVACY.md)

## Context

Release Gate §39는 Observability · Alert · Tracing이 없으면 출시 후보에서 제외한다.  
현재 수단은 Supabase logs + `edge_ops_events` + UI toast/banner뿐이며, ADR-004에서 Sentry/APM은 Trade desk L9 이후으로 defer했다.  
외부 APM을 즉시 도입하면 privacy review·DSN·번들·8GB 운영 부하가 추가된다.  
반면 최소안만으로 R10에 들어가면 Trigger hit를 감지하지 못한다.

**엔진 경계:** 본 ADR은 **운영 스택 결정**이다. R0에서 migration/RPC 변경 **0**. R4에서 alert 스크립트·correlation 배선 시 Owner 게이트.

## Options

| 옵션                   | 내용                                                                                                           | 장점                                    | 단점                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------- |
| **A — 최소안 (채택)**  | Supabase logs + `edge_ops_events` + `provider_health` + ops alert 스크립트/webhook + money/auth correlation id | 기존 자산 · privacy 기본 · ADR-004 정합 | crash grouping 약함 · 수동 비중             |
| B — Sentry 즉시 재도입 | `@sentry/react` + server DSN                                                                                   | 자동 fingerprint                        | privacy·번들·Owner 승인 필요 · ADR-004 충돌 |
| C — 외부 APM만         | Datadog/New Relic 등                                                                                           | 풍부한 대시보드                         | 비용·비밀·학습 곡선 · 출시 지연             |

## Decision

### 1. Launch ~ R11: Option A (최소안)

| 계층          | 정본 경로                                                                                       | R4 DoD                               |
| ------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------ |
| Observability | Supabase project logs · `edge_ops_events` · `provider_health` · CI advisors                     | lane별 수집 경로 Evidence            |
| Alert         | §20b Trigger ↔ webhook/channel 1:1 · dry-fire Evidence                                          | rule export 또는 dry-fire URI        |
| Tracing       | money · auth · provider 경로에 request/correlation id (Edge/RPC 헤더 또는 idempotency key 연계) | 샘플 Evidence 1건 이상               |
| Client        | toast stable code · fetch-error · market-status (ADR-004 대체)                                  | Sentry SDK **금지** until Owner 승인 |

### 2. Sentry / 외부 APM

- **Deferred** — ADR-004와 동일. Soft Launch 이후 Owner 명시 승인 시에만 재평가.
- 승인 전 `@sentry/*` init · PostHog money path **금지**.

### 3. False-green 금지 (H-04 연계)

- job HTTP 2xx ≠ provider outcome.
- `edge_ops_events`는 applied / rejected / circuit-open / RPC-failed count를 분리한다 (R4 구현).

### 4. Alert ↔ Rollback Trigger 매핑

| Trigger key (§52)               | Alert 채널 (R4 등록)          |
| ------------------------------- | ----------------------------- |
| `http_5xx_rate_pct_5m`          | ops webhook                   |
| `money_delta_alarm`             | ops webhook + Immediate Owner |
| `provider_timeout_rate_pct`     | ops webhook                   |
| `rpc_p95_ms`                    | ops webhook                   |
| permission / wallet error burst | ops webhook                   |

## Consequences

| Positive                                    | Negative                              |
| ------------------------------------------- | ------------------------------------- |
| R4에서 §39 게이트를 충족할 실행 경로가 명확 | R4 전까지 EXT-01 OPEN                 |
| Sentry 없이 soft-launch 가능                | 자동 crash grouping 없음              |
| ADR-004·privacy 유지                        | Operator dry-fire·수동 checklist 부담 |

## Links

- Finding `EXT-01` · `H-04`
- [`PLATFORM_SLO_SLA.yaml`](../../OPERATIONS/PLATFORM_SLO_SLA.yaml) Trigger 섹션
- [`PLATFORM_INCIDENT_RESPONSE.md`](../../OPERATIONS/PLATFORM_INCIDENT_RESPONSE.md)
