<!-- GENERATED — do not edit by hand. Run: bun run generate:ssot-freeze-manifest -->

# Display Data Contract Audit

> **Generated:** 2026-07-25 · **Source:** `page-controller-view-shapes.ts` + hook scan
> **Rule:** UI displays controller/hook/RPC values only. No client-side money recompute.

| Domain  | Display field                                                                     | Contract location                            | Status                          | Notes                                                                                                                                   |
| ------- | --------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Wallet  | heroBalanceDisplay                                                                | WalletPageControllerView                     | **missing-from-contract**       |                                                                                                                                         |
| Wallet  | phonAvailableDisplay                                                              | WalletPageControllerView                     | **missing-from-contract**       |                                                                                                                                         |
| Wallet  | usdtAvailableDisplay                                                              | WalletPageControllerView                     | **missing-from-contract**       |                                                                                                                                         |
| Wallet  | withdrawAvailableDisplay                                                          | WalletPageControllerView                     | **missing-from-contract**       |                                                                                                                                         |
| Wallet  | giftcardPreviewFeeDisplay                                                         | WalletPageControllerView                     | **missing-from-contract**       |                                                                                                                                         |
| Trade   | futuresPositions (incl. realized_pnl, margin_amount, liquidation_price, open_fee) | TradePageControllerView.futuresPositions     | **missing-from-contract**       | Position rows from DB via useFuturesPositions                                                                                           |
| Trade   | phonAvail / usdtAvail                                                             | TradePageControllerView                      | **exposed**                     | Wallet balances for order panel                                                                                                         |
| Trade   | oraclePriceDisplay / priceDisplay                                                 | TradePageControllerView                      | **exposed**                     | Display-only formatted prices                                                                                                           |
| Trade   | margin input / margin mode                                                        | TradePageControllerView                      | **missing-from-contract**       | useFuturesActions local state — not on TradePageControllerView; UI must not invent margin                                               |
| Trade   | unrealized PnL per position                                                       | FuturesPosition row                          | **hook-only-not-in-controller** | Available on position objects if UI reads futuresPositions[].realized_pnl / computed display in presentation layer from RPC fields only |
| Casino  | autoBet action                                                                    | CasinoPageControllerView.autoBet             | **exposed**                     | Pipeline auto bet — not session stats                                                                                                   |
| Casino  | available balance                                                                 | CasinoPageControllerView.available           | **exposed**                     |                                                                                                                                         |
| Casino  | Auto Bet running state                                                            | useAutoBetQueue (UI-only hook)               | **ui-only-local**               | remaining, runningStake, cumulativeProfit, firesPlaced — **not** in CasinoPageControllerView                                            |
| Casino  | Auto Bet remaining cycles                                                         | useAutoBetQueue.remaining                    | **ui-only-local**               | Presentation queue state — OK for UI-only; must not drive ledger                                                                        |
| Casino  | Auto Bet stop conditions (profit/loss limits)                                     | AutoBetConfig in useAutoBetQueue             | **ui-only-local**               | stopOnProfit, stopOnLoss — client queue only                                                                                            |
| Casino  | Auto Bet session profit                                                           | useAutoBetQueue.cumulativeProfit             | **ui-only-local**               | Display-only cumulative string                                                                                                          |
| Casino  | Auto Bet live statistics (firesPlaced)                                            | useAutoBetQueue.firesPlaced                  | **ui-only-local**               | Session counter — not RPC                                                                                                               |
| Sports  | odds / fixture prices                                                             | SportsPageControllerView.hubProps            | **exposed**                     | Via SportsHubControllerProps — verify in sports controller                                                                              |
| Sports  | sportsBlocked / gate reason                                                       | SportsPageControllerView                     | **exposed**                     |                                                                                                                                         |
| Staking | balanceDisplay / rewardsDisplay / aprDisplay                                      | StakingPageControllerView                    | **exposed**                     |                                                                                                                                         |
| Wallet  | ledger rows (amount/fee)                                                          | LedgerPageControllerView.rows                | **exposed**                     | LedgerRowView from RPC                                                                                                                  |
| Casino  | settlement / bet result                                                           | CasinoPageControllerView.bet / settledResult | **exposed**                     |                                                                                                                                         |
| RG      | deposit/loss limits                                                               | RgPageViewProps via useRgPageController      | **exposed**                     |                                                                                                                                         |
| Trade   | oracleStale / circuit breaker                                                     | TradePageControllerView.oracleStale          | **exposed**                     |                                                                                                                                         |
| Wallet  | phonKrwRateStale / rate unavailable                                               | WalletPageControllerView.phonKrwRateStale    | **exposed**                     | 15min TTL parity with server phon_krw_rate_stale                                                                                        |

## Summary

- **exposed:** 12
- **ui-only-local:** 5 (Auto Bet queue — allowed; must not mutate ledger)
- **missing-from-contract:** 7
- **hook-only-not-in-controller:** 1

## Product decisions required before U-phase

- **Wallet · heroBalanceDisplay** — options: remove from blueprint, show "not available yet", or operator-approved engine/controller work (separate from UI reset)
- **Wallet · phonAvailableDisplay** — options: remove from blueprint, show "not available yet", or operator-approved engine/controller work (separate from UI reset)
- **Wallet · usdtAvailableDisplay** — options: remove from blueprint, show "not available yet", or operator-approved engine/controller work (separate from UI reset)
- **Wallet · withdrawAvailableDisplay** — options: remove from blueprint, show "not available yet", or operator-approved engine/controller work (separate from UI reset)
- **Wallet · giftcardPreviewFeeDisplay** — options: remove from blueprint, show "not available yet", or operator-approved engine/controller work (separate from UI reset)
- **Trade · futuresPositions (incl. realized_pnl, margin_amount, liquidation_price, open_fee)** — options: remove from blueprint, show "not available yet", or operator-approved engine/controller work (separate from UI reset)
- **Trade · margin input / margin mode** — options: remove from blueprint, show "not available yet", or operator-approved engine/controller work (separate from UI reset)

## Auto Bet explicit boundary

Auto Bet **session UI state** (`useAutoBetQueue`) is intentionally **outside** `CasinoPageControllerView`.
The controller exposes only `autoBet()` pipeline action and `available` balance.
Rebuild UI may show queue stats from the hook; it must **not** recompute payouts or balances.

## Controllers without freeze type

- `useAccountPageController` — no `FreezeControllerView` yet
- `useOnboardingPageController` — no `FreezeControllerView` yet
- **Action:** add freeze shapes before account/onboarding U-phase, or treat as presentation-only static
