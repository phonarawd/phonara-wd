# GAMES-INTEGRATION — Blackjack Result (Lovable delta · merged 2026-06-15)

> **Status:** merged into [`GAMES-INTEGRATION.md`](GAMES-INTEGRATION.md) under `### blackjack` · handoff v15.  
> Lovable Blackjack §8 uses this as contract anchor alongside `packages/game-engine/src/games/blackjack.ts`.

## Result (settle)

```ts
{ totalMultiplier: number | string }  // wire often toFixed(6) string
```

- **Celebrate:** `Number(totalMultiplier) >= 1.01` juice · `=== 1` push neutral · `< 1` shake
- **WIN/LOSE UI:** from `totalMultiplier` only — not card recompute · not RPC top-level `won`
- **Forbidden in `bet.result`:** `payout`, `won`, `cards`, `dealerScore`, `playerScore`
- Top-level **`bet.multiplier = Number(totalMultiplier)`** on mock/paste
- **v1 UI:** `insurance` move not exposed (engine supports; never send)
- **§1-H reset:** N/A
- **Floats:** 51 (shuffle)
- **Local mirror:** `playBlackjack.ts` — engine static import 0

Engine: `packages/game-engine/src/games/blackjack.ts` · SQL: `_bj_play` in `20260614000089` + float fix `20260614000092`.
