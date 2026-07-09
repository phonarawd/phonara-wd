# ADR-005: Synthetic Orderbook → Real CLOB Defer (Engine Wave)

> **상태:** Proposed (defer stub) · **날짜:** 2026-07-08  
> **플랜:** Trade Desk Zero-Defect QA audit · todo `backlog-engine-adr` (부록 C L4 · §10)  
> **SSOT:** [`ENGINE_BOUNDARY.md`](../../SSOT/ENGINE_BOUNDARY.md) §Engine Wave defer  
> **UX canon:** [`TRADE_UX_CANON.md`](../../SSOT/TRADE_UX_CANON.md) · [`TRADE_BEGINNER_LANGUAGE_CANON.md`](../../SSOT/TRADE_BEGINNER_LANGUAGE_CANON.md)

## Context

Trade desk 현재 체결 모델은 **house counterparty + synthetic orderbook**이다. Chart/WS feed는 display-only(Binance/Bybit klines)이며 settlement는 내부 RPC로만 발생한다 ([`TRADE_UX_CANON.md`](../../SSOT/TRADE_UX_CANON.md) §플랫폼 독립 정산).

P2-D는 **신뢰·규제 리스크**를 UI disclosure + confirm ack로 완화한다. 실 CLOB(중앙호가·maker/taker 매칭 · 외부 유동성)는 **엔진·마이그레이션·정산 모델 전면 변경**이 필요하다.

**엔진 freeze:** Phase R · Trade Desk Zero-Defect P0~P4는 **migration 0** — CLOB 착수는 Engine Wave + P4-D 승인 후만.

## Decision

### 1. Defer real CLOB until Engine Wave operator approval

- **Launch through L9:** synthetic book + house fill + P2-D disclosure/ack 유지.
- **금지:** 「Binance/Bybit에서 체결」· 외부 API key 주문 라우팅 · CLOB 용어를 유저 UI에 노출 ([`TRADE_BEGINNER_LANGUAGE_CANON.md`](../../SSOT/TRADE_BEGINNER_LANGUAGE_CANON.md)).

### 2. Accepted substitutes (P2-D · non-waivable until CLOB)

| Layer            | Substitute                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| Order book panel | i18n — 참조 호가 · house counterparty                                                           |
| Submit path      | confirm ack 미체크 시 submit blocked                                                            |
| Engine           | `rpc_get_synthetic_book` · internal fill RPC (baseline)                                         |
| Settlement       | [`MONEY_CONSERVATION_FORMULA.md`](../../SSOT/MONEY_CONSERVATION_FORMULA.md) Wallet Conservation |

### 3. Engine Wave 착수 조건 (when approved)

```text
1. 본 ADR Accepted + operator 서면 승인 (P4-D)
2. security-auditor 사전 review PASS
3. 정산 모델 ADR — house vs CLOB leg 분해 · GRAND_TOTAL 불변 증명
4. db reset → test:sql Σ=0 → stack:push-remote → advisor 0
5. E2E conservation + cross-user + idempotency 회귀
```

### 4. Out of scope (명시)

- Tablet 768 / swipe UX — **P2** (Engine Wave 아님)
- Display feed Layer B — chart/WS는 CLOB defer와 **독립** (display-only 유지)

## Consequences

| Positive                              | Negative                              |
| ------------------------------------- | ------------------------------------- |
| Launch RC without CLOB complexity     | 거래소 parity gap (maker/taker depth) |
| Wallet Conservation baseline 유지     | Regulator-grade matching 미구현       |
| P2-D로 house counterparty 투명성 확보 | Real liquidity / external routing 0   |

## Links

- Plan §10 · P2-D · v6 L4 Engine Wave ADR
- [`REBUILD_PLAN_v1.md`](../REBUILD_PLAN_v1.md) §13.1.2 — no external CLOB
- [`TRADE_DESK_MIGRATION_VERIFICATION.md`](../../OPERATIONS/TRADE_DESK_MIGRATION_VERIFICATION.md) — defer RED STOP
