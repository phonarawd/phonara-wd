/**
 * Imperative stage handle — Plan §25.5 · React ↔ stage boundary.
 * Props must not drive per-frame React state; playOutcome replays RPC only.
 */

export type CasinoStageHandle = {
  playOutcome(result: Record<string, unknown>): Promise<void>;
  reset(): void;
};

export type CasinoStagePhase = 'idle' | 'replaying' | 'settled';
