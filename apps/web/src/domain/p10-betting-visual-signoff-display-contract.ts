/**
 * P10 Sports+Casino operator visual sign-off display contract
 * (§20.12 · §22.2 Sports+Casino · §23 · §34.17 domain cards).
 * Authority: plan `p10-operator-visual-signoff` · YAML #215.
 *
 * Agent gate green ≠ Plan YAML completed — operator preview visual
 * `VISUAL APPROVED: p10-operator-visual-signoff` chat record required.
 */

import { GAME_CODES } from '@phonara/game-engine';

import {
  CASINO_FAIRNESS_ROUTE,
  CASINO_LOBBY_ROUTE,
  casinoLobbyGamePath,
} from './casino-lobby-display-contract';
import {
  DA_W5_DOMAIN_CARD_SIGNATURES,
  DA_W5_DOMAIN_CARD_VARIANTS,
} from './da-w5-cards-domain-variants-display-contract';
import {
  P10_GATE_BETTING_TODO,
  P10_OPERATOR_VISUAL_SIGNOFF_TODO,
} from './p10-gate-betting-display-contract';
import {
  P10_CASINO_FAIRNESS_REGISTERED_ROUTES,
  P10_SPORTS_HUB_REGISTERED_ROUTES,
} from '../product/shell/subnav-route-manifest';
import { CASINO_GAME_SLUGS } from '../product/shell/surface-domain-boundary';

export { P10_OPERATOR_VISUAL_SIGNOFF_TODO };

/** Immediate prerequisite — P10 Betting GATE must be closed. */
export const P10_VISUAL_PREREQUISITE_TODO = P10_GATE_BETTING_TODO;

/** Mandatory operator viewport smoke widths for P10 VISUAL (§20.12 · §22.2). */
export const P10_BETTING_VISUAL_VIEWPORT_WIDTHS = [390, 768, 1024] as const;

/** Operator smoke routes — sports hub + casino + fairness + 12 games. */
export const P10_BETTING_VISUAL_ROUTES = [
  '/sports',
  ...P10_SPORTS_HUB_REGISTERED_ROUTES,
  CASINO_LOBBY_ROUTE,
  ...P10_CASINO_FAIRNESS_REGISTERED_ROUTES,
  ...GAME_CODES.map((code) => casinoLobbyGamePath(code)),
] as const;

export type P10BettingVisualRoute = (typeof P10_BETTING_VISUAL_ROUTES)[number];

/**
 * §22.2 Sports+Casino · §23 · §34.17 — structural checklist ids
 * (automated gate companions · operator visual).
 */
export const P10_BETTING_DESIGNER_CHECKLIST = [
  'sports-left-league-rail',
  'sports-fixture-odds-board',
  'sports-bet-slip-rail',
  'sports-stake-usdt-phon-selector',
  'sports-odds-card-variant',
  'sports-live-inplay-surface',
  'sports-my-bets-panel',
  'sports-rules-panel',
  'casino-lobby-stake-grid',
  'casino-lobby-category-chips',
  'casino-play-card-variant',
  'casino-pf-fairness-entry',
  'casino-game-shell-stake-toggle',
  'casino-auto-bet-first-class',
  'casino-12-game-stages',
  'dual-currency-sports-slip',
  'dual-currency-casino-shell',
  'responsive-3-tier-390-768-1024',
] as const;

/** §13.1.1 — operator spot-check surfaces for USDT/PHON selector visibility. */
export const P10_DUAL_CURRENCY_SPOT_CHECK_SURFACES = [
  'sports-stake-currency-selector',
  'casino-stake-currency',
] as const;

/** §34.17 domain card personalities required on Sports+Casino surfaces. */
export const P10_VISUAL_DOMAIN_CARD_VARIANTS = ['sports-odds', 'casino-play'] as const;

/** Interactive controls that must wire handlers or nav (dead control 0 · §32.7 H8). */
export const P10_BETTING_DEAD_CONTROL_TEST_IDS = [
  'sports-slip-place-bet',
  'sports-stake-currency-usdt',
  'sports-stake-currency-phon',
  'casino-lobby-pf-verify',
  'casino-lobby-play-crash',
  'casino-place-bet',
  'casino-stake-currency-usdt',
  'casino-stake-currency-phon',
  'casino-bet-mode-manual',
  'casino-bet-mode-auto',
  'casino-fairness-verify-run',
  'casino-shell-back-lobby',
] as const;

export const P10_BETTING_VISUAL_PREVIEW_DEPLOY_SCRIPT = 'deploy:pages:web:preview' as const;

/** Operator records preview URL at VISUAL APPROVED closeout (§20.12). */
export const P10_BETTING_VISUAL_PREVIEW_URL = 'https://preview.phonara-web.pages.dev' as const;

/** gate:ai-impl owner paths. */
export const P10_BETTING_VISUAL_TEST_PATHS = [
  'apps/web/src/domain/__tests__/p10-betting-visual-signoff-display-contract.test.ts',
  'apps/web/src/product/surfaces/__tests__/p10-betting-visual-signoff.test.tsx',
] as const;

/** Non-waivable sync for P10 VISUAL agent companions. */
export function assertP10BettingVisualSignoffSync(): void {
  if (P10_OPERATOR_VISUAL_SIGNOFF_TODO !== 'p10-operator-visual-signoff') {
    throw new Error('p10-visual: todo id drift');
  }

  if (P10_VISUAL_PREREQUISITE_TODO !== 'p10-gate-betting') {
    throw new Error('p10-visual: prerequisite must be p10-gate-betting');
  }

  if (P10_BETTING_VISUAL_VIEWPORT_WIDTHS.length !== 3) {
    throw new Error('p10-visual: viewport smoke must be 390/768/1024');
  }

  if (!P10_BETTING_VISUAL_ROUTES.includes('/sports')) {
    throw new Error('p10-visual: /sports hub required');
  }

  if (!P10_BETTING_VISUAL_ROUTES.includes('/casino')) {
    throw new Error('p10-visual: /casino lobby required');
  }

  if (!P10_BETTING_VISUAL_ROUTES.includes(CASINO_FAIRNESS_ROUTE)) {
    throw new Error('p10-visual: /casino/fairness required');
  }

  if (GAME_CODES.length !== 12 || CASINO_GAME_SLUGS.length !== 12) {
    throw new Error('p10-visual: expected 12 casino games');
  }

  for (const code of GAME_CODES) {
    const path = casinoLobbyGamePath(code);
    if (!P10_BETTING_VISUAL_ROUTES.includes(path as P10BettingVisualRoute)) {
      throw new Error(`p10-visual: missing game route ${path}`);
    }
  }

  for (const variant of P10_VISUAL_DOMAIN_CARD_VARIANTS) {
    if (!(DA_W5_DOMAIN_CARD_VARIANTS as readonly string[]).includes(variant)) {
      throw new Error(`p10-visual: domain card ${variant} not in §34.17`);
    }
    if (!DA_W5_DOMAIN_CARD_SIGNATURES[variant]) {
      throw new Error(`p10-visual: missing §34.17 signature for ${variant}`);
    }
  }

  if (P10_BETTING_DEAD_CONTROL_TEST_IDS.length < 8) {
    throw new Error('p10-visual: dead-control test ids incomplete');
  }

  if (P10_BETTING_DESIGNER_CHECKLIST.length < 12) {
    throw new Error('p10-visual: designer checklist incomplete');
  }

  if (P10_BETTING_VISUAL_PREVIEW_DEPLOY_SCRIPT !== 'deploy:pages:web:preview') {
    throw new Error('p10-visual: preview deploy script drift');
  }

  if (!P10_BETTING_VISUAL_PREVIEW_URL.startsWith('https://preview.')) {
    throw new Error('p10-visual: preview URL must be preview host');
  }
}
