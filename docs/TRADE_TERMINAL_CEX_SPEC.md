# Trade Terminal CEX Spec (Hybrid · 정본)

> Operator 검증용. 코드 토큰: [`trade-terminal.css`](../apps/web/src/components/trade/terminal/tokens/trade-terminal.css)

## Hybrid Primary

| Surface | Primary |
|---------|---------|
| Futures PC | Bybit Unified Trading |
| Futures Mobile | Bybit App (Chart \| Book \| Trades) |
| Spot PC | Binance Spot Pro |
| Spot Mobile | Binance Spot App |
| Staking /trade | OKX Earn discover |
| Staking /staking | OKX Earn dashboard |

## PC Grid

- **Futures:** `280px | minmax(480px, 1fr) | 320px` + BottomDock 240px
- **Spot:** `260px | 1fr | 300px`

## E2E testId (변경 금지)

| testId | Surface |
|--------|---------|
| `trade-mode-spot` / `futures` / `staking` | TradeModeShell tabs |
| `trade-panel-spot` / `futures` / `staking` | Mode panels |
| `spot-submit` / `spot-confirm` | Spot money |
| `futures-open` / `futures-open-confirm` / `futures-close` | Futures money |
| `staking-page` / `staking-action-confirm` | `/staking` money |
| `trade-staking-pool-*` | Staking discover cards |

## Engine boundary

- Hook/RPC display only — UI 재계산 금지
- Synthetic order book — `trade.orderbook.displayOnly` label 유지
