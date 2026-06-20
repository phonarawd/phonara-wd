# TRADE_MAJORS_BBOOK RFC

> Operator 검증용 정본. Phase 0 산출물.  
> USDT·PHON 담보 B-book · Tier-1 메이저 catalog · Hybrid display chart.

## 1. Product grammar

| 개념 | 설명 |
|---|---|
| **underlying** | BTC, ETH, SOL 등 상품 라벨 (지갑 통화 아님) |
| **stake_currency** | `USDT` \| `PHON` — lock·pay·reward 정산 통화 |
| **futures symbol** | `{BASE}USDT-SIM` |
| **spot symbol** | `{BASE}_USDT` |
| **oracle key** | futures symbol과 동일 (spot은 `{BASE}_USDT` 또는 futures key 공유 — migration 정본 따름) |

PHON native: `PHONUSDT-PERP`, `PHON_USDT` — external `market_sources` **제외**.

## 2. B-book / 독단적 정산

- 체결·청산·스테이킹 lock/reward: PHONARA RPC + append-only ledger only.
- 외부 거래소: **oracle median 입력**(Edge `price-feed`) + **표시용 WS kline** only.
- 브라우저 display hook → settlement RPC 호출 **금지** (rg: `display-chart` → `rpc_open_` / `rpc_spot_` / `rpc_stake` 0 hit).

## 3. Hybrid chart contract

| Track | 소스 | 용도 |
|---|---|---|
| A | `useDisplayKline` (Binance/Bybit WS) | 캔들·last tick **표시** |
| B | `oracle_prices` + `usePrices` | 주문 티켓·청산·정산 |

Fallback: WS down → `rpc_get_candles` + Realtime oracle.

i18n: `trade.chart.displayFeedDisclosure`, `trade.chart.internalReferenceDisclosure`.

## 4. Tier-1 catalog (20)

`BTC, ETH, SOL, BNB, XRP, ADA, DOGE, AVAX, LINK, DOT, MATIC, LTC, UNI, ATOM, NEAR, APT, ARB, OP, INJ, SUI`

각 futures: `market_sources` ×3 (binance/bybit/okx), `oracle_min_sources:{SYMBOL}` = 2.

## 5. Spot (synthetic holdings)

- `spot_holdings(user_id, base_asset, quantity)` — wallet `PHON/USDT/KRW` 유지.
- Buy USDT: debit USDT → credit holdings base qty @ oracle.
- Buy PHON: debit PHON @ `PHON_USDT` oracle 환산.
- `rpc_spot_market_buy(p_market, p_stake_currency, p_amount, p_client_request_id)` — `PHON_USDT` + USDT legacy wrapper 유지.

## 6. Staking

- `staking_pools(reference_asset, stake_currency, reward_currency, term, ...)`.
- `rpc_stake(...)` — lock USDT or PHON; reward same currency.
- `rpc_stake_phon` → wrapper (backward compat).

## 7. PERF contract (launch gate)

| ID | 규칙 |
|---|---|
| PERF-1 | `/trade` 단일 surface — `TradeEngineBody` 별도 mount 금지 |
| PERF-2 | 차트 1 instance / viewport · lazy lightweight-charts |
| PERF-3 | WS rAF batch · visible tab only · blur disconnect |
| PERF-4 | Display WS ≠ oracle duplicate subscription |
| PERF-5 | React Query staleTime 통일 |
| PERF-6 | 선택 마켓 1개 WS only |
| PERF-7 | 10s tick Long Task >200ms = 0 (manual checklist) |

## 8. Rollback

- `futures_markets.is_active = false` / `spot_markets.is_active = false` / pool `is_active = false`.
- Circuit halt: 기존 `market_circuit_breakers` 경로.

## 9. Operator sign-off

- [ ] Tier-1 list 확정
- [ ] Migration wave GO (P1 → P5)
- [ ] PERF-1 merge verified
- [ ] E2E conservation green
