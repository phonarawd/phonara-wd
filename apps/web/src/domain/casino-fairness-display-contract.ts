/**
 * P10 Casino fairness — `/casino/fairness` PF browser verifier (§23.2.1 · YAML #212).
 * ENGINE:exists — `@phonara/game-engine` verifyRound · one-shot nonce=1.
 * E23 UI unlock (`casinoLiveLive`) exposes account PF seed controls alongside
 * one-shot verifier (nonce=1 path remains for `p_use_account_pf=false`).
 */

import type { GameCode } from '@phonara/game-engine';
import { GAME_CODES } from '@phonara/game-engine';
import type { MessageKey } from '@phonara/i18n';

import { LAUNCH_GATES } from '../lib/launch-gates';
import { P10_GAMES_BATCH_D_TODO } from './casino-games-batch-d-display-contract';
import {
  CASINO_FAIRNESS_ROUTE,
  CASINO_LOBBY_ROUTE,
  P10_PAGE_CASINO_FAIRNESS_TODO,
  P10_PAGE_CASINO_TODO,
} from './casino-lobby-display-contract';

export {
  CASINO_FAIRNESS_ROUTE,
  P10_PAGE_CASINO_FAIRNESS_TODO,
} from './casino-lobby-display-contract';

export const P10_PAGE_CASINO_FAIRNESS_PREREQUISITE_TODOS = [
  P10_PAGE_CASINO_TODO,
  P10_GAMES_BATCH_D_TODO,
] as const;

/** One-shot verifier nonce — always 1 when not using account PF. */
export const CASINO_FAIRNESS_NONCE = 1 as const;

/** §23.2.1 / E23 — seed rotation UI when `casinoLiveLive`. */
export const CASINO_FAIRNESS_SEED_ROTATION_UI_EXPOSED = LAUNCH_GATES.casinoLiveLive;

/** Client seed: account persist when live; one-shot still accepts per-bet. */
export const CASINO_FAIRNESS_CLIENT_SEED_MODE = LAUNCH_GATES.casinoLiveLive
  ? ('account_or_per_bet' as const)
  : ('per_bet' as const);

export const CASINO_FAIRNESS_ROUTE_OWNER = 'casino.fairness.tsx' as const;
export const CASINO_FAIRNESS_SURFACE_OWNER = 'casino-fairness-page.tsx' as const;
export const CASINO_FAIRNESS_CONTROLLER_OWNER = 'use-casino-fairness-verifier.ts' as const;

export const CASINO_FAIRNESS_SURFACE_OWNERS = [CASINO_FAIRNESS_SURFACE_OWNER] as const;

export const CASINO_FAIRNESS_ENGINE_STATUS = 'exists' as const;
export const CASINO_FAIRNESS_EXPOSURE = 'live' as const;

export const CASINO_FAIRNESS_VERIFY_SOURCE = '@phonara/game-engine verifyRound' as const;

export const CASINO_FAIRNESS_SEO_TITLE_KEY =
  'seo.gamesFairness.title' as const satisfies MessageKey;
export const CASINO_FAIRNESS_HERO_TITLE_KEY =
  'casino.fairness.title' as const satisfies MessageKey;
export const CASINO_FAIRNESS_HERO_DESC_KEY =
  'casino.fairness.description' as const satisfies MessageKey;

export const CASINO_FAIRNESS_LIMITS_TITLE_KEY =
  'casino.fairness.limits.title' as const satisfies MessageKey;
export const CASINO_FAIRNESS_LIMITS_CLIENT_SEED_KEY =
  'casino.fairness.limits.clientSeed' as const satisfies MessageKey;
export const CASINO_FAIRNESS_LIMITS_NONCE_KEY =
  'casino.fairness.limits.nonce' as const satisfies MessageKey;
export const CASINO_FAIRNESS_LIMITS_ROTATION_KEY =
  'casino.fairness.limits.rotation' as const satisfies MessageKey;

/** E23 live honesty keys — account PF + rotation available. */
export const CASINO_FAIRNESS_LIMITS_CLIENT_SEED_LIVE_KEY =
  'casino.fairness.limits.clientSeed.live' as const satisfies MessageKey;
export const CASINO_FAIRNESS_LIMITS_NONCE_LIVE_KEY =
  'casino.fairness.limits.nonce.live' as const satisfies MessageKey;
export const CASINO_FAIRNESS_LIMITS_ROTATION_LIVE_KEY =
  'casino.fairness.limits.rotation.live' as const satisfies MessageKey;

export const CASINO_FAIRNESS_SEED_CONTROLS_TITLE_KEY =
  'casino.fairness.seedControls.title' as const satisfies MessageKey;
export const CASINO_FAIRNESS_SEED_SAVE_KEY =
  'casino.fairness.seedControls.saveClient' as const satisfies MessageKey;
export const CASINO_FAIRNESS_SEED_ROTATE_KEY =
  'casino.fairness.seedControls.rotate' as const satisfies MessageKey;
export const CASINO_FAIRNESS_SEED_NEXT_NONCE_KEY =
  'casino.fairness.seedControls.nextNonce' as const satisfies MessageKey;

export const CASINO_FAIRNESS_VERIFY_CTA_KEY =
  'casino.fairness.verify.run' as const satisfies MessageKey;
export const CASINO_FAIRNESS_GAME_LABEL_KEY =
  'casino.confirm.game' as const satisfies MessageKey;
export const CASINO_FAIRNESS_SELECTION_LABEL_KEY =
  'casino.fairness.verify.selection' as const satisfies MessageKey;
export const CASINO_FAIRNESS_EXPECTED_LABEL_KEY =
  'casino.fairness.verify.expected' as const satisfies MessageKey;
export const CASINO_FAIRNESS_CLIENT_SEED_LABEL_KEY =
  'games.shared.verify.clientSeed' as const satisfies MessageKey;
export const CASINO_FAIRNESS_NONCE_LABEL_KEY =
  'games.shared.verify.nonce' as const satisfies MessageKey;
export const CASINO_FAIRNESS_SERVER_SEED_LABEL_KEY =
  'casino.verify.serverSeed' as const satisfies MessageKey;
export const CASINO_FAIRNESS_SERVER_HASH_LABEL_KEY =
  'casino.verify.seedHash' as const satisfies MessageKey;

export const CASINO_FAIRNESS_RESULT_HASH_MATCH_KEY =
  'casino.fairness.verify.hashMatch' as const satisfies MessageKey;
export const CASINO_FAIRNESS_RESULT_HASH_MISMATCH_KEY =
  'casino.fairness.verify.hashMismatch' as const satisfies MessageKey;
export const CASINO_FAIRNESS_RESULT_OUTCOME_MATCH_KEY =
  'casino.fairness.verify.outcomeMatch' as const satisfies MessageKey;
export const CASINO_FAIRNESS_RESULT_OUTCOME_MISMATCH_KEY =
  'casino.fairness.verify.outcomeMismatch' as const satisfies MessageKey;
export const CASINO_FAIRNESS_RESULT_OUTCOME_SKIPPED_KEY =
  'casino.fairness.verify.outcomeSkipped' as const satisfies MessageKey;
export const CASINO_FAIRNESS_INVALID_JSON_KEY =
  'casino.fairness.verify.invalidJson' as const satisfies MessageKey;
export const CASINO_FAIRNESS_MISSING_FIELDS_KEY =
  'casino.fairness.verify.missingFields' as const satisfies MessageKey;

export const CASINO_FAIRNESS_GAME_CODES = GAME_CODES;

/** Pre-E23 forbidden markers — empty when live unlock exposes controls. */
export const CASINO_FAIRNESS_FORBIDDEN_UI = LAUNCH_GATES.casinoLiveLive
  ? ([] as const)
  : ([
      'seed_rotation_controls',
      'client_seed_persist_settings',
      'nonce_increment_controls',
    ] as const);

export function isCasinoFairnessGameCode(value: string): value is GameCode {
  return (CASINO_FAIRNESS_GAME_CODES as readonly string[]).includes(value);
}

/** Lobby PF CTA unlocks when this fairness surface is live. */
export function resolveCasinoFairnessPfCtaEnabled(): boolean {
  return CASINO_FAIRNESS_EXPOSURE === 'live';
}

export function assertCasinoFairnessDisplayContractSync(): void {
  if (P10_PAGE_CASINO_FAIRNESS_TODO !== 'p10-page-casino-fairness') {
    throw new Error('casino-fairness: owner todo id drift');
  }
  if (!P10_PAGE_CASINO_FAIRNESS_PREREQUISITE_TODOS.includes(P10_GAMES_BATCH_D_TODO)) {
    throw new Error('casino-fairness: Batch D prerequisite missing');
  }
  if (CASINO_FAIRNESS_ROUTE !== '/casino/fairness') {
    throw new Error('casino-fairness: route must stay /casino/fairness');
  }
  if (CASINO_LOBBY_ROUTE !== '/casino') {
    throw new Error('casino-fairness: lobby route drift');
  }
  if (CASINO_FAIRNESS_NONCE !== 1) {
    throw new Error('casino-fairness: one-shot verifier nonce pin must stay 1');
  }
  if (LAUNCH_GATES.casinoLiveLive) {
    if (!CASINO_FAIRNESS_SEED_ROTATION_UI_EXPOSED) {
      throw new Error('casino-fairness: seed rotation UI must expose when casinoLiveLive');
    }
    if (CASINO_FAIRNESS_CLIENT_SEED_MODE !== 'account_or_per_bet') {
      throw new Error('casino-fairness: client seed mode must be account_or_per_bet when live');
    }
  } else {
    if (CASINO_FAIRNESS_SEED_ROTATION_UI_EXPOSED) {
      throw new Error('casino-fairness: seed rotation UI must stay hidden until E23 UI');
    }
    if (CASINO_FAIRNESS_CLIENT_SEED_MODE !== 'per_bet') {
      throw new Error('casino-fairness: client seed must stay per-bet until E23 UI');
    }
  }
  if (CASINO_FAIRNESS_GAME_CODES.length !== 12) {
    throw new Error('casino-fairness: expected 12 game codes');
  }
  if (!resolveCasinoFairnessPfCtaEnabled()) {
    throw new Error('casino-fairness: PF CTA must be enabled when fairness is live');
  }
}
