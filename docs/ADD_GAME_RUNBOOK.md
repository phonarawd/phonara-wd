# ADD_GAME Runbook — PHONARA Casino Integration Factory

Step-by-step checklist for adding a new `game_code` to the casino engine.  
**UI surfaces are Lovable paste-only** — PHONARA adds engine, SQL, tests, and adapter contracts only.

---

## Step 0 — Code name lock (rollback impossible)

Postgres `ALTER TYPE game_code ADD VALUE` is **irreversible**. Confirm the code name with product before migration.

Earn retention `rpc_spin_roulette` and casino `roulette` are **separate domains** — never share keys, RPCs, or metrics.

---

## 12-step checklist

| # | Artifact | Path / command |
|---|----------|----------------|
| 1 | Enum add (standalone migration) | `supabase/migrations/*_game_code_enum_{code}.sql` |
| 2 | TS game module | `packages/game-engine/src/games/{code}.ts` + `registerGame()` |
| 3 | Barrel export | `packages/game-engine/src/index.ts` |
| 4 | SQL `_game_result` + `_game_max_payout_multiplier` | Next migration after enum |
| 5 | Feature flag | `app_config` `feature_game_{code}_enabled` |
| 6 | SQL parity vectors | `supabase/tests/casino_parity_test.sql` |
| 7 | TS/SQL parity | `tests/integration/casino-sql-parity.test.ts` CASE_DEF |
| 8 | Conservation scenario | `supabase/tests/conservation_test.sql` or dedicated test |
| 9 | UI adapter (no visual UI) | `game-config.ts`, `IMPORTED_GAME_LOADERS`, `/casino/{code}` route |
| 10 | i18n keys | `packages/i18n` — `casino.game.{code}`, fields, options |
| 11 | E2E feature flags | `tests/e2e/global-setup.ts` |
| 12 | Playwright smoke | prepare → bet → PF verify → Σ=0 |

Automated gate: `bun run check:games`

---

## Enum-add rule

**One migration file = enum ADD VALUE only.** Implementation DDL goes in the **next** migration (Postgres cannot use new enum values in the same transaction they were added).

`scripts/check-game-registration.ts` fails if enum-add and `_game_result` appear in the same file (except files named `*enum*`).

---

## Required gates per game PR

```bash
bun run typecheck
bun run test -- packages/game-engine
supabase db reset
bun run test:sql
PHONARA_SQL_PARITY=1 bun run test -- tests/integration/casino-sql-parity.test.ts
bun run test -- packages/game-engine/src/lib/rtp-harness.test.ts
bun run check:i18n
bun run check:release
bun run check:games
# After build/E2E:
bun run clean
```

Heavy RTP: `PHONARA_RTP_FULL=1 bun run test -- packages/game-engine/src/lib/rtp-harness.test.ts`

---

## Engine contract (Lovable)

- Props: `ImportedGameSurfaceProps` — `apps/web/src/components/games/shared/types.ts`
- Selection schema: `docs/GAMES-INTEGRATION.md`
- E2E testids: `casino-prepare-hash`, `casino-stake-input`, `casino-place-bet`, `casino-bet-confirm-confirm`
- All bets via `useCasinoRoundPipeline` — no client-side settlement

---

## Determinism

Game results must use `floatStream()` only — no `Date.now()` / `Math.random()` in `packages/game-engine/src/games/`.  
Enforced by `scripts/check-determinism.ts`.

---

## Exposure cap model

- Selection-scaled games (crash, dice): multiplier from selection
- Paytable games (slots): `maxJackpot / activeLines`
- Multi-leg (roulette): `Σ(weight_i × maxMult_i) / Σ(weight)`

SQL: `_game_max_payout_multiplier` + `casino_{code}_house_exposure_cap_{ccy}`

---

See also: `docs/GAMES-INTEGRATION.md`, `docs/CASINO_SLO.md`
