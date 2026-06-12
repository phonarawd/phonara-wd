import type { GameCode, VerifyResult } from '@phonara/game-engine';
import type { MessageKey } from '@phonara/i18n';

export type Currency = 'PHON' | 'USDT';

export interface GameConfig {
  code: GameCode;
  labelKey: MessageKey;
  descriptionKey: MessageKey;
  defaultStake: string;
  defaultSelection: Record<string, unknown>;
  fields: GameField[];
}

export type GameField =
  | { kind: 'text'; key: string; labelKey: MessageKey; inputMode?: 'decimal' | 'numeric' }
  | { kind: 'number'; key: string; labelKey: MessageKey; min: number; max: number; step?: number }
  | { kind: 'select'; key: string; labelKey: MessageKey; options: Array<{ value: string; labelKey: MessageKey }> }
  | { kind: 'cells'; key: string; labelKey: MessageKey; max: number };

export interface RoundCommitment {
  round_id: string;
  server_seed_hash: string;
}

export interface BetResponse {
  bet_id: string;
  round_id: string;
  game: GameCode;
  status: 'won' | 'lost' | 'pending' | 'cancelled' | 'voided' | 'parity_hold';
  server_seed_hash: string;
  result: Record<string, unknown>;
  payout: string;
  already_placed: boolean;
}

export interface RevealResponse {
  round_id: string;
  server_seed: string;
  server_seed_hash: string;
  result: Record<string, unknown>;
}

export interface VerificationEvidence {
  server_seed_hash: string;
  server_seed: string;
  result: Record<string, unknown>;
  verification: VerifyResult;
}

export interface RecentBet {
  id: string;
  game: GameCode;
  status: string;
  stake: string;
  payout: string | null;
  currency: Currency;
  created_at: string;
}
