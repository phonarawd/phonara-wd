# GAMES-INTEGRATION — PHONARA Engine Contract for Lovable UI

Technical contract for connecting Lovable game surfaces to the existing PHONARA casino engine.  
**UI must not reimplement settlement, RNG, or payout math.**  
**PHONARA does not build game visuals** — Lovable ZIP is paste-only (`PresentationImportPlaceholder` until absorption).

---

## Game codes (DB enum)

```sql
CREATE TYPE game_code AS ENUM (
  'crash', 'limbo', 'dice', 'mines', 'hilo', 'plinko',
  'mint_reels', 'gold_rush', 'roulette', 'blackjack'
);
```

Single source in TS: `GAME_CODES` in `packages/game-engine/src/registry.ts`.

Adding games: follow `docs/ADD_GAME_RUNBOOK.md` (enum migration → engine migration → gates).

---

## Currency

| Code | Usage |
|---|---|
| `PHON` | Platform token — default casino currency |
| `USDT` | Stablecoin alternative |

All amounts: **decimal strings** with up to 6 fractional digits (e.g. `"10.000000"`). Never `number`.

---

## RPC flow

### 1. Open round — `rpc_open_game_round`
### 2. Place bet — `rpc_place_game_bet` (atomic settlement)
### 3. Reveal — `rpc_reveal_game_round`
### 4. Verify — `verifyRound()` from `@phonara/game-engine`

---

## Provably fair

```
HMAC-SHA256(key=serverSeed, message=`${clientSeed}:${nonce}:${cursor}`)
```

---

## Selection schemas

### crash
`{ autoCashout: string }`

### dice
`{ target: string; direction: 'over' | 'under' }`

**Result (settle):** `{ roll: number; won: boolean }` — roll ∈ [0.00, 99.99] (`diceFromFloat = floor(f×10000)/100`). Engine: `packages/game-engine/src/games/dice.ts`. WIN/LOSE from **`result.won` only** — not client `roll > target` recompute. Not `resultMultiplier` (Limbo) / `totalMultiplier` in result. Celebrate tier: **`bet.multiplier`** (top-level; Lovable `dice/multiplier.ts` local mirror = `Math.floor(99/prob)/100`, target=50 over ≈1.98). Paste: adapter injects mult or UI-only `payout/stake` derive. **§1-H reset N/A** (scalar selection).

### mines
`{ mineCount: number; revealedCells: number[] }`

**Result (settle):** `{ minePositions: number[]; hitMine: boolean }` — not `mines` / `hit`. Engine: `packages/game-engine/src/games/mines.ts`.

### plinko
`{ rows: 8 | 12 | 16; risk: 'low' | 'medium' | 'high' }`

### limbo
`{ target: string }`

### hilo
`{ startCard: number | null; guesses: ('higher' | 'lower' | 'skip')[] }`

**Result (settle):** `{ cards: number[]; rounds: HiLoRound[]; won: boolean }` where each `HiLoRound` is `{ card, guess, correct, multiplier }`. Engine: `packages/game-engine/src/games/hilo.ts`. Not flat `streak` / top-level `multiplier` alone.

### Round-boundary selection (mines · hilo)

Clear accumulated in-round picks without resetting other selection fields:

| Game | Reset |
|------|-------|
| mines | `revealedCells: []` (keep `mineCount`) |
| hilo | `guesses: []`, `startCard: null` |

**When:** user prepare-round (immediate) · bet settle (+400ms, Lovable/PHONARA parity).  
**PHONARA:** `apps/web/src/features/casino/reset-accumulated-selection.ts` · **Lovable:** `useMockPipeline` §1-H.

### mint_reels / gold_rush
`{ lines: number }` — integer 1..20, one spin = one bet

### roulette (casino — NOT Earn `rpc_spin_roulette`)
```ts
{
  bets: Array<{
    type: 'straight' | 'split' | 'red' | 'black' | 'even' | 'odd' | 'low' | 'high'
        | 'dozen1' | 'dozen2' | 'dozen3' | 'column1' | 'column2' | 'column3';
    value: number | null;  // straight: pocket 0..36; split: see below (NOT sum)
    stakeWeight: number;   // positive; stake split proportionally
  }>;
}
```

**Split encoding (engine-fixed — wrong value wins silently):**

- `value` = the **lower** adjacent pocket number (never the sum of the two pockets).
- Wins when `winningNumber === value` **or** `winningNumber === value + 1`.
- Example: split on pockets 1|2 → `{ type: 'split', value: 1, stakeWeight: 1 }` (not `3`).

Engine: `packages/game-engine/src/games/roulette.ts` (`legWins`, `case 'split'`).

**Result (settle):** `{ winningNumber: number; totalMultiplier: number }` — European single-zero · `winningNumber ∈ [0..36]`. Engine: `packages/game-engine/src/games/roulette.ts` · SQL `_roulette_evaluate`. **WIN/LOSE from `Number(totalMultiplier) > 0` only** — not client `bets[] × winningNumber` recompute. Wire JSON may serialize `totalMultiplier` as number or string; UI adapter normalizes both. **Forbidden in result:** `payout`, `legs`, `legWins`, `multiplier`, `wonBets`. Celebrate tier: **`Number(totalMultiplier) >= 1.01`** · top-level **`bet.multiplier = Number(totalMultiplier)`** on mock/paste. **Zero pocket:** `winningNumber === 0` → only `{ type: 'straight', value: 0 }` wins (split `0|1` and all outside bets lose). **§1-H reset N/A** (bets persist until user clear/repeat). **Earn `rpc_spin_roulette` ≠ casino roulette** — separate domain.

### blackjack
```ts
{
  actions: Array<{ seat: number; move: 'hit' | 'stand' | 'double' | 'split' | 'insurance' }>;
}
```
One-shot submission (like mines). Engine replays legality + dealer S17.

**Result (settle):** `{ totalMultiplier: number }` — engine/SQL emit `{ totalMultiplier }` only. Wire JSON may serialize as number or string; UI adapter normalizes (`toFixed(6)` on mock). Engine: `packages/game-engine/src/games/blackjack.ts` · SQL `_bj_play` / `_game_result` blackjack branch (**51 floats**).

**Celebrate / feel (Lovable §8):** **`Number(totalMultiplier) >= 1.01`** juice · **`=== 1`** push neutral · **`< 1`** shake. Top-level **`bet.multiplier = Number(totalMultiplier)`** on mock/paste. **Forbidden in `bet.result`:** `payout`, `won`, `cards`, `dealerScore`, `playerScore`. **Do not use** RPC wrapper top-level `won` for UI (push `1` may set `won=true`).

**v1 Lovable UI:** `insurance` move **not exposed** (engine supports; UI unmount + never send). Selection **`actions` REPLACE** array (no push). **§1-H reset N/A.**

**Local mirror (Lovable):** `playBlackjack.ts` — engine static import 0.

---

## ImportedGameSurfaceProps

File: `apps/web/src/components/games/shared/types.ts`

Lovable components receive pipeline callbacks only — no direct RPC.

---

## E2E testids (required on bet surfaces)

| testid | Purpose |
|--------|---------|
| `casino-prepare-hash` | Open round |
| `casino-stake-input` | Stake field |
| `casino-place-bet` | Open confirm dialog |
| `casino-bet-confirm-confirm` | Submit bet |
| `casino-bet-confirm-cancel` | Cancel confirm |
| `casino-error` | Error display |
| `casino-fairness-verifier` | PF panel |

---

## Route map

| URL | GameCode |
|---|---|
| `/casino/crash` | crash |
| `/casino/dice` | dice |
| `/casino/mines` | mines |
| `/casino/plinko` | plinko |
| `/casino/limbo` | limbo |
| `/casino/hilo` | hilo |
| `/casino/mint-reels` | mint_reels |
| `/casino/gold-rush` | gold_rush |
| `/casino/roulette` | roulette |
| `/casino/blackjack` | blackjack |
| `/casino/fairness` | docs |
| `/games` | catalog (Lovable presentation) |

---

## i18n namespace

- `casino.game.{code}` / `casino.game.{code}.desc`
- `casino.field.{field}`
- `casino.option.{option}`

---

## Paste zones

```
apps/web/src/components/games/{game}/
apps/web/src/presentation-import/pages/games-*.tsx
```

---

## Gates

- `bun run check:games` — registration completeness
- `bun run check:determinism` — no Math.random in games
- `PHONARA_SQL_PARITY=1` — TS/SQL `_game_result` parity
- RTP harness — `packages/game-engine/src/lib/rtp-harness.test.ts`

See also: `docs/ADD_GAME_RUNBOOK.md`, `docs/CASINO_SLO.md`, `apps/web/PRESENTATION_IMPORT.md`
