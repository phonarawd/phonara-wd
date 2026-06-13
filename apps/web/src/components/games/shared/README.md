# Lovable game paste zone — shared

Paste Lovable `src/games/shared/*` here unchanged.

**P0:** `BetPanel`, `BetHistoryStrip`, `FairnessSheet`, `RGGate`  
**Hooks:** `useGameLoop`, `useSound`, `useHaptics`, `useReducedMotionGuard`, `useAutoBetQueue` (UI queue only)

Export `ImportedGameSurfaceProps` types from here or `types.ts` — must match `docs/GAMES-INTEGRATION.md`.

Do not call RPC or compute payouts. Props/callbacks only.
