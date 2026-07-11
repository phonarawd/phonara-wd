/**
 * P10 Betting Part GATE (§12.19.6 · §22.2.4 · §23.2.1 · §31.4 · §32.5 · §32.7 H5 · Fiat#12).
 * Authority: `p10-gate-betting` · YAML #214 · REBUILD_PLAN_v1.
 *
 * Bundle closeout for Sports + Casino 12 games. Casino E2E Σ=0 = operator/CI
 * (G13) — local Implemented = this contract + gate:ai-impl vitest.
 */

import { GAME_CODES } from '@phonara/game-engine';

import {
  CASINO_FAIRNESS_ROUTE,
} from './casino-fairness-display-contract';
import {
  assertCasinoFiatHintSessionLockDisplayContractSync,
  CASINO_FIAT_HINT_WIRE_SURFACE,
} from './casino-fiat-hint-session-lock-display-contract';
import { assertCasinoOutcomeReplayContractSync } from './casino-outcome-replay-contract';
import {
  findFiatHintComplaintRisk,
  P10_CASINO_FIAT_HINT_SESSION_LOCK_TODO,
  P10_SPORTS_FIAT_HINT_WIRE_TODO,
} from './fiat-reference-display-contract';
import {
  BET_EDUCATION_FAIRNESS_ROUTE,
  BET_EDUCATION_RG_ROUTE,
  BET_EDUCATION_RISK_TOPICS,
  FIRST_BET_EDUCATION_STORAGE_KEY,
} from './operator-trust-pages-display-contract';
import {
  assertSportsParityContractSync,
  findSportsComplaintRisk,
  P10_SPORTS_LAYOUT_DEDUP_TODO,
  SPORTS_USER_COMPLAINT_RISKS,
} from './sports-exchange-parity-display-contract';
import {
  assertSportsFiatHintWireDisplayContractSync,
  SPORTS_FIAT_HINT_WIRE_SURFACE,
} from './sports-fiat-hint-wire-display-contract';
import { P10_SPORTS_HUB_REGISTERED_ROUTES } from './sports-hub-pages-display-contract';
import { findTradeComplaintRisk } from './trade-exchange-parity-display-contract';
import { CASINO_GAME_SLUGS } from '../product/shell/surface-domain-boundary';

export const P10_GATE_BETTING_TODO = 'p10-gate-betting' as const;

/** Immediate prerequisite — first-bet education must be closed before GATE. */
export const P10_FIRST_BET_EDUCATION_TODO = 'p10-first-bet-education' as const;

/** Next Part VISUAL after this GATE (§20.12). */
export const P10_OPERATOR_VISUAL_SIGNOFF_TODO = 'p10-operator-visual-signoff' as const;

/**
 * Bundle prerequisites that must be DONE before P10 GATE closeout.
 * Order mirrors Track A ladder — GATE does not re-implement surfaces.
 */
export const P10_GATE_BETTING_PREREQUISITE_TODOS = [
  P10_FIRST_BET_EDUCATION_TODO,
  'p10-page-casino-fairness',
  'p10-games-batch-d',
  'p10-games-batch-c',
  'p10-games-batch-b',
  'p10-games-batch-a',
  P10_CASINO_FIAT_HINT_SESSION_LOCK_TODO,
  'p10-casino-replay-and-infra',
  'p10-page-casino',
  'p10-sports-rules-and-vip-stub',
  P10_SPORTS_LAYOUT_DEDUP_TODO,
  'p10-sports-slip-advanced-wire',
  'p10-sports-live-surface-wire',
  'p10-sports-parity-contract-and-board',
  'p10-sports-hub-pages',
  P10_SPORTS_FIAT_HINT_WIRE_TODO,
] as const;

/** §12.19.6 P10 fairness route — must match shell subnav manifest. */
export const P10_GATE_CASINO_FAIRNESS_ROUTES = [CASINO_FAIRNESS_ROUTE] as const;

/** §12.19.6 P10 manifest routes — sports hub + casino fairness. */
export const P10_GATE_BETTING_MANIFEST_ROUTES = [
  ...P10_SPORTS_HUB_REGISTERED_ROUTES,
  ...P10_GATE_CASINO_FAIRNESS_ROUTES,
] as const;

/** §32.7 H5 dual-currency stake ComplaintRisk rows (trade registry · P10 owners). */
export const P10_GATE_BETTING_H5_STAKE_COMPLAINT_IDS = [
  'sports-stake-usdt-only',
  'casino-stake-usdt-only',
] as const;

/** Fiat#12 — Sports/Casino hint PASS with this GATE. */
export const P10_GATE_BETTING_FIAT12_COMPLAINT_IDS = [
  'fiat-hint-sports-odds-order',
  'fiat-hint-casino-drift',
] as const;

/** §32.7 H5 + sports ComplaintRisk mitigations allowed at GATE. */
export const P10_GATE_BETTING_COMPLAINT_MITIGATIONS = [
  'live',
  'disabled',
  'disabled+key',
  'built_hidden',
] as const;

/**
 * §31.4 sports abuse defense — UI wires display/exception only; engine enforces.
 * Gate asserts ComplaintRisk row exists (not engine reimplementation).
 */
export const P10_GATE_BETTING_SECTION_31_4_SPORTS_RISK_IDS = [
  'sports-stake-cap-surprise',
] as const;

/** Casino E2E authority — G13 · operator gate run or GitHub CI e2e job. */
export const P10_GATE_BETTING_CASINO_E2E_AUTHORITY = 'operator-or-ci' as const;

/**
 * Canonical CI/operator target path (Plan §23.5).
 * File may be absent mid-Phase-R after Demolition — restore is CI/P13, not this GATE.
 */
export const P10_GATE_BETTING_CASINO_E2E_SPEC = 'tests/e2e/casino.spec.ts' as const;

/** Stage file stems under product/surfaces/games/ (slug form for hyphenated codes). */
export const P10_GATE_BETTING_STAGE_FILE_BY_CODE = {
  crash: 'crash-stage.tsx',
  limbo: 'limbo-stage.tsx',
  dice: 'dice-stage.tsx',
  mines: 'mines-stage.tsx',
  hilo: 'hilo-stage.tsx',
  plinko: 'plinko-stage.tsx',
  mint_reels: 'mint-reels-stage.tsx',
  gold_rush: 'gold-rush-stage.tsx',
  roulette: 'roulette-stage.tsx',
  blackjack: 'blackjack-stage.tsx',
  deepshaft: 'deepshaft-stage.tsx',
  momentum: 'momentum-stage.tsx',
} as const;

/** On-disk artifacts required for P10 GATE. */
export const P10_GATE_BETTING_ARTIFACT_PATHS = [
  'domain/p10-gate-betting-display-contract.ts',
  'product/shell/subnav-route-manifest.ts',
  'product/shell/bet-first-visit-education-gate.tsx',
  'product/shell/bet-first-visit-education-sheet.tsx',
  'features/responsible-gaming/bet-first-visit-education.ts',
  'product/surfaces/sports/sports-bet-slip-panel.tsx',
  `product/surfaces/sports/${SPORTS_FIAT_HINT_WIRE_SURFACE}`,
  'product/surfaces/games/casino-game-shell.tsx',
  'product/surfaces/games/casino-game-stage.tsx',
  `product/surfaces/games/${CASINO_FIAT_HINT_WIRE_SURFACE}`,
  'product/surfaces/casino/casino-fairness-page.tsx',
  'routes/games.$gameCode.tsx',
  'routes/casino.fairness.tsx',
] as const;

/** gate:ai-impl owner paths. */
export const P10_GATE_BETTING_TEST_PATHS = [
  'apps/web/src/domain/__tests__/p10-gate-betting-display-contract.test.ts',
  'apps/web/src/product/shell/__tests__/subnav-route-manifest.test.ts',
  'apps/web/src/product/shell/__tests__/bet-first-visit-education-gate.test.tsx',
  'apps/web/src/domain/__tests__/sports-fiat-hint-wire-display-contract.test.ts',
  'apps/web/src/domain/__tests__/casino-fiat-hint-session-lock-display-contract.test.ts',
  'apps/web/src/domain/__tests__/casino-outcome-replay-contract.test.ts',
  'apps/web/src/domain/__tests__/sports-exchange-parity-display-contract.test.ts',
] as const;

/** Non-waivable sync for P10 Betting GATE closeout. */
export function assertP10GateBettingSync(): void {
  if (P10_GATE_BETTING_TODO !== 'p10-gate-betting') {
    throw new Error('p10-gate-betting: todo id drift');
  }

  if (!P10_GATE_BETTING_PREREQUISITE_TODOS.includes(P10_FIRST_BET_EDUCATION_TODO)) {
    throw new Error('p10-gate-betting: missing prerequisite p10-first-bet-education');
  }

  if (P10_OPERATOR_VISUAL_SIGNOFF_TODO !== 'p10-operator-visual-signoff') {
    throw new Error('p10-gate-betting: next VISUAL todo drift');
  }

  if (GAME_CODES.length !== 12) {
    throw new Error(`p10-gate-betting: expected 12 GAME_CODES, got ${GAME_CODES.length}`);
  }

  if (CASINO_GAME_SLUGS.length !== 12) {
    throw new Error(`p10-gate-betting: expected 12 CASINO_GAME_SLUGS, got ${CASINO_GAME_SLUGS.length}`);
  }

  for (const code of GAME_CODES) {
    if (!(code in P10_GATE_BETTING_STAGE_FILE_BY_CODE)) {
      throw new Error(`p10-gate-betting: missing stage file mapping for ${code}`);
    }
  }

  if (P10_SPORTS_HUB_REGISTERED_ROUTES.length !== 5) {
    throw new Error('p10-gate-betting: sports hub manifest must list 5 child routes');
  }

  if (P10_GATE_CASINO_FAIRNESS_ROUTES.length !== 1) {
    throw new Error('p10-gate-betting: casino fairness must be in subnav manifest');
  }

  if (P10_GATE_CASINO_FAIRNESS_ROUTES[0] !== '/casino/fairness') {
    throw new Error('p10-gate-betting: casino fairness route drift');
  }

  if (BET_EDUCATION_RISK_TOPICS.length !== 3) {
    throw new Error('p10-gate-betting: first-bet education must cover slip · rg · fairness');
  }

  if (FIRST_BET_EDUCATION_STORAGE_KEY !== 'phonara.education.bet.dismissed') {
    throw new Error('p10-gate-betting: first-bet education storage key drift');
  }

  if (BET_EDUCATION_RG_ROUTE !== '/legal/responsible-gaming') {
    throw new Error('p10-gate-betting: RG education route drift');
  }

  if (BET_EDUCATION_FAIRNESS_ROUTE !== '/casino/fairness') {
    throw new Error('p10-gate-betting: fairness education route drift');
  }

  assertSportsParityContractSync();
  assertSportsFiatHintWireDisplayContractSync();
  assertCasinoFiatHintSessionLockDisplayContractSync();
  assertCasinoOutcomeReplayContractSync();

  for (const id of P10_GATE_BETTING_H5_STAKE_COMPLAINT_IDS) {
    const row = findTradeComplaintRisk(id);
    if (!row) {
      throw new Error(`p10-gate-betting: missing H5 ComplaintRisk ${id}`);
    }
    if (row.mitigatedBy !== 'live') {
      throw new Error(`p10-gate-betting: H5 ComplaintRisk ${id} must be live (§32.7 H5)`);
    }
  }

  for (const id of P10_GATE_BETTING_FIAT12_COMPLAINT_IDS) {
    const row = findFiatHintComplaintRisk(id);
    if (!row) {
      throw new Error(`p10-gate-betting: missing Fiat#12 ComplaintRisk ${id}`);
    }
    if (row.mitigatedBy !== 'live') {
      throw new Error(`p10-gate-betting: Fiat#12 ComplaintRisk ${id} must be live`);
    }
  }

  for (const row of SPORTS_USER_COMPLAINT_RISKS) {
    if (
      !(P10_GATE_BETTING_COMPLAINT_MITIGATIONS as readonly string[]).includes(row.mitigatedBy)
    ) {
      throw new Error(`p10-gate-betting: sports ComplaintRisk ${row.id} unmitigated`);
    }
  }

  for (const id of P10_GATE_BETTING_SECTION_31_4_SPORTS_RISK_IDS) {
    const row = findSportsComplaintRisk(id);
    if (!row) {
      throw new Error(`p10-gate-betting: §31.4 sports risk row ${id} missing`);
    }
  }

  if (P10_GATE_BETTING_CASINO_E2E_AUTHORITY !== 'operator-or-ci') {
    throw new Error('p10-gate-betting: casino E2E must stay operator/CI (G13)');
  }

  if (!P10_GATE_BETTING_CASINO_E2E_SPEC.includes('casino.spec')) {
    throw new Error('p10-gate-betting: casino E2E spec path drift');
  }

  if (P10_GATE_BETTING_TEST_PATHS.length < 5) {
    throw new Error('p10-gate-betting: owner test paths incomplete');
  }
}
