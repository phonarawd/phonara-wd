# GAMES-INTEGRATION — PHONARA Engine Contract for Lovable UI

Technical contract for connecting Lovable game surfaces to the existing PHONARA casino engine.  
**UI must not reimplement settlement, RNG, or payout math.**

---

## Game codes (frozen in DB)

```sql
CREATE TYPE game_code AS ENUM (
  'crash', 'limbo', 'dice', 'mines', 'hilo', 'plinko'
);
```

Adding Wheel, Keno, slots, live tables requires a new migration + `packages/game-engine` module **before** UI work.

---

## Currency

| Code | Usage |
|---|---|
| `PHON` | Platform token — default casino currency |
| `USDT` | Stablecoin alternative |

All amounts: **decimal strings** with up to 6 fractional digits (e.g. `"10.000000"`). Never `number`.

Config keys (SQL `app_config`): `casino_min_stake_phon`, `casino_max_stake_phon`, `casino_max_payout_phon`, `casino_house_exposure_cap_phon`, and USDT equivalents.

---

## RPC flow

### 1. Open round

```ts
await callRpc('rpc_open_game_round', { p_game: 'dice' });
// → { round_id, server_seed_hash }
```

### 2. Place bet (atomic settlement)

```ts
await callRpc('rpc_place_game_bet', {
  p_round_id: string,
  p_currency: 'PHON' | 'USDT',
  p_stake: string,
  p_selection: Json,      // game-specific — see below
  p_client_seed: string,
  p_idempotency_key: string,
});
// → BetResponse { bet_id, status, result, payout, ... }
```

Settlement happens **inside** `rpc_place_game_bet`. There is no separate client settle step.

### 3. Reveal

```ts
await callRpc('rpc_reveal_game_round', { p_round_id });
// → { server_seed, server_seed_hash, result }
```

### 4. Client verification

```ts
import { verifyRound } from '@phonara/game-engine';

await verifyRound({
  game: gameCode,
  serverSeed: revealed.server_seed,
  serverSeedHash: commitment.server_seed_hash,
  clientSeed,
  nonce: 1,
  selection,
  expectedResult: placed.result,
});
```

---

## Provably fair

Implementation: `packages/game-engine/src/fairness/`

```
HMAC-SHA256(
  key = serverSeed,
  message = `${clientSeed}:${nonce}:${cursor}`
)
```

- Floats derived from HMAC hex → uniform [0, 1)
- **Do not** use `${client}:${nonce}` (missing `:cursor`)

---

## Selection schemas per game

### crash

```ts
{ autoCashout: string }  // e.g. "2.00", min 1.01
```

**Model:** One-shot. Player sets target multiplier **before** bet. Server computes `crashMultiplier` and whether `autoCashout` was reached.  
**UI note:** Pixi rising curve is **cosmetic replay** of `result.crashMultiplier`. No mid-round server cashout.

### dice

```ts
{ target: string; direction: 'over' | 'under' }
```

### mines

```ts
{ mineCount: number; revealedCells: number[] }  // distinct indices 0–24
```

**Model:** One-shot. All revealed cells submitted in a single bet.  
**UI note:** Click-to-reveal builds `revealedCells` in local state; bet fires once. Display multiplier may use `minesMultiplier()` from game-engine for **preview only** — `payout` comes from server.

### plinko

```ts
{ rows: 8 | 12 | 16; risk: 'low' | 'medium' | 'high' }
```

### limbo

```ts
{ target: string }
```

### hilo

```ts
{ startCard: number | null; guesses: ('higher' | 'lower' | 'skip')[] }
```

---

## PHONARA hook (do not fork)

File: `apps/web/src/features/casino/use-casino-round.ts`

```ts
const pipeline = useCasinoRoundPipeline({
  gameCode,
  currency,
  stake,
  selection,
  clientSeed,
  clientSeedIsAuto,
  setClientSeed,
  userId,
  onRecentBetsChange,
});

// pipeline.prepareRound()   — open round
// pipeline.openBetConfirm() — show confirm (required for money UX)
// pipeline.submitBet()      — place + reveal + verify + wallet invalidate
```

Route adapter (`routes/casino.tsx`) owns state; Lovable game component receives props.

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
| `/casino/fairness` | docs |
| `/games` | catalog (presentation) |

---

## Responsible gaming

- DB + `rpc_place_game_bet` enforces limits
- UI: `/responsible-gaming` + gate modal on RG error codes
- Engine path: `apps/web/src/domain/responsible-gaming.ts`

---

## Paste zones

```
apps/web/src/components/games/shared/     # BetPanel, hooks (sound, loop)
apps/web/src/components/games/{crash,...}/
apps/web/src/presentation-import/pages/games-*.tsx
```

---

## Tests that must stay green

- `packages/game-engine` unit tests (payout parity)
- `supabase/tests/casino_schema_test.sql`
- `supabase/tests/conservation_test.sql`
- Playwright casino / funnel E2E

---

See also: `docs/LOVABLE_ABSORPTION_PLAN_FINAL.md`, `apps/web/PRESENTATION_IMPORT.md`
