# GAMES-INTEGRATION — Roulette Result (Lovable delta · merged 2026-06-15)

> **Status:** merged into [`GAMES-INTEGRATION.md`](GAMES-INTEGRATION.md) under `### roulette` · handoff v11.  
> Lovable Roulette §0-RED uses this as contract anchor alongside `packages/game-engine/src/games/roulette.ts`.

## Result (settle)

```ts
{ winningNumber: number; totalMultiplier: number }
```

- `winningNumber ∈ [0..36]` (European single-zero)
- **WIN/LOSE:** `Number(totalMultiplier) > 0` only — not client `bets[] × winningNumber`
- Wire JSON may use number or string for `totalMultiplier`; UI adapter normalizes both
- **Forbidden in result:** `payout`, `legs`, `legWins`, `multiplier`, `wonBets`
- Celebrate: `Number(totalMultiplier) >= 1.01` · top-level `bet.multiplier = Number(totalMultiplier)`
- **Zero pocket:** only `{ type: 'straight', value: 0 }` wins when `winningNumber === 0`
- **§1-H reset:** N/A (bets persist until user clear/repeat)
- **Earn `rpc_spin_roulette` ≠ casino roulette**

Engine: `packages/game-engine/src/games/roulette.ts` · SQL: `_roulette_evaluate` in `20260614000089_casino_new_games_engine.sql`.
