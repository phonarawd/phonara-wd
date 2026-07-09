/**
 * P9 Trade + Staking operator visual sign-off display contract (§20.12 · §22.2 · §22.2.1–§22.2.2).
 * Authority: plan `p9-operator-visual-signoff` · G1–G7 · §13.1.1 dual currency spot-check.
 */

import { STAKING_HUB_ROUTE, STAKING_POSITIONS_ROUTE } from './staking-display-contract';
import {
  P7_EARN_STAKING_ROUTES,
  P9_TRADE_REGISTERED_ROUTES,
} from '../product/shell/subnav-route-manifest';

export const P9_OPERATOR_VISUAL_SIGNOFF_TODO = 'p9-operator-visual-signoff' as const;

/** Mandatory operator viewport smoke widths for P9 VISUAL (§20.12 · §22.2.2 G5). */
export const P9_TRADE_VISUAL_VIEWPORT_WIDTHS = [390, 768, 1024, 2560] as const;

/** Operator smoke routes — `/trade` hub + P9 manifest + Earn staking (plan §22.2 Trade). */
export const P9_TRADE_VISUAL_ROUTES = [
  '/trade',
  ...P9_TRADE_REGISTERED_ROUTES,
  ...P7_EARN_STAKING_ROUTES,
] as const;

export type P9TradeVisualRoute = (typeof P9_TRADE_VISUAL_ROUTES)[number];

/** §22.2.2 G1–G6 structural checklist ids (automated gate companions · operator visual). */
export const P9_TRADE_DESIGNER_CHECKLIST = [
  'g1-price-context-header',
  'g1-risk-status-banner',
  'g1-chart-zone',
  'g1-order-ticket-zone',
  'g1-depth-book-zone',
  'g1-portfolio-dock-or-tabs',
  'g2-tabular-nums-money',
  'g2-empty-states-never-blank',
  'g3-semantic-long-short-tokens',
  'g4-book-click-ticket-price',
  'g4-balance-percent-chips',
  'g5-responsive-4-tier',
  'g6-a11y-chart-interval-fullscreen',
  'g7-tier-b-hedge-hidden',
  'g7-tier-b-reduce-only-hidden',
  'g7-tier-b-cross-margin-canary-disabled',
  'dual-currency-usdt-phon-selector',
  'dual-currency-margin-column',
  'staking-hub-pool-cards',
  'staking-positions-panel',
] as const;

/** §13.1.1 — operator spot-check surfaces for USDT/PHON selector visibility. */
export const P9_DUAL_CURRENCY_SPOT_CHECK_SURFACES = [
  'spot-order-ticket-stake-currency',
  'futures-order-ticket-margin-currency',
  'futures-positions-margin-column',
  'trade-fills-history-margin-column',
  'staking-pool-stake-label',
] as const;

/** Interactive controls that must wire handlers or nav (dead control 0 · §32.7). */
export const P9_TRADE_DEAD_CONTROL_TEST_IDS = [
  'spot-submit',
  'futures-submit',
  'trade-desk-mobile-sticky-cta',
  'staking-stake-cta',
  'staking-positions-hub-link',
] as const;

export const P9_TRADE_VISUAL_PREVIEW_DEPLOY_SCRIPT = 'deploy:pages:web:preview' as const;

/** Operator records preview URL at VISUAL APPROVED closeout (§20.12). */
export const P9_TRADE_VISUAL_PREVIEW_URL = 'https://preview.phonara-web.pages.dev' as const;

/** Staking routes included in P9 VISUAL scope (plan content `/staking*`). */
export const P9_VISUAL_STAKING_ROUTES = [STAKING_HUB_ROUTE, STAKING_POSITIONS_ROUTE] as const;
