/**
 * DA W7 Digital Aurora Elevation operator visual sign-off
 * (§20.12 · §34.28 · Home+Shell+Trade · YAML #235).
 * Authority: plan `da-w7-operator-visual-dae-signoff`.
 *
 * Agent gate green ≠ Plan YAML completed — operator preview visual
 * `VISUAL APPROVED: da-w7` chat record required (§20.12).
 */

import { DA_W7_ENFORCEMENT_STRICT_TOKENS_TODO } from './da-w7-enforcement-strict-tokens-display-contract';
import { EARN_HOME_CANONICAL_ROUTE } from './earn-home-display-contract';

/** Plan todo id — Digital Aurora Elevation operator visual sign-off. */
export const DA_W7_OPERATOR_VISUAL_DAE_SIGNOFF_TODO =
  'da-w7-operator-visual-dae-signoff' as const;

/** Immediate prerequisite — W7 strict tokens GATE must be closed. */
export const DA_W7_VISUAL_PREREQUISITE_TODO = DA_W7_ENFORCEMENT_STRICT_TOKENS_TODO;

/**
 * Mandatory operator viewport smoke widths for DA W7 VISUAL
 * (§20.12 · §3.0 4-tier · includes ultra 2560).
 */
export const DA_W7_DAE_VISUAL_VIEWPORT_WIDTHS = [390, 768, 1024, 2560] as const;

/**
 * Operator smoke routes — Home + Shell hubs + Trade desk
 * (todo content: Home+Shell+Trade).
 */
export const DA_W7_DAE_VISUAL_ROUTES = [
  EARN_HOME_CANONICAL_ROUTE,
  '/wallet',
  '/trade',
  '/trade/futures',
  '/sports',
  '/casino',
] as const;

export type DaW7DaeVisualRoute = (typeof DA_W7_DAE_VISUAL_ROUTES)[number];

/**
 * §34 Digital Aurora Elevation · §20.12 designer checklist
 * (automated gate companions · operator visual).
 */
export const DA_W7_DAE_DESIGNER_CHECKLIST = [
  'home-earn-fold-scan',
  'home-signature-day-flow',
  'home-next-action-accent',
  'shell-aurora-backdrop',
  'shell-bottomnav-five-tabs',
  'shell-topbar-chrome',
  'trade-spot-desk-grid',
  'trade-text-tiny-book-labels',
  'strict-tokens-no-legacy-primary',
  'brand-mark-aurora-visible',
  'responsive-4-tier-390-768-1024-2560',
  'axe-critical-zero',
] as const;

/** Surfaces under DAE visual spot-check. */
export const DA_W7_DAE_SPOT_CHECK_SURFACES = [
  'earn-home-page',
  'app-shell-chrome',
  'spot-desk-page',
] as const;

/** Interactive controls that must wire handlers or nav (dead control 0 · §32.7 H8). */
export const DA_W7_DAE_DEAD_CONTROL_TEST_IDS = [
  'earn-home-next-action-cta',
  'earn-home-entry-cta-missions',
  'bottom-nav',
  'app-topbar',
  'topbar-account-avatar',
  'spot-submit',
] as const;

export const DA_W7_DAE_VISUAL_PREVIEW_DEPLOY_SCRIPT = 'deploy:pages:web:preview' as const;

/** Operator records preview URL at VISUAL APPROVED closeout (§20.12). */
export const DA_W7_DAE_VISUAL_PREVIEW_URL = 'https://preview.phonara-web.pages.dev' as const;

/** Chat phrase operator must post for Plan YAML completed (§20.12). */
export const DA_W7_DAE_VISUAL_APPROVED_PHRASE = 'VISUAL APPROVED: da-w7' as const;

/** gate:ai-impl owner paths. */
export const DA_W7_DAE_VISUAL_TEST_PATHS = [
  'apps/web/src/domain/__tests__/da-w7-operator-visual-dae-signoff-display-contract.test.ts',
  'apps/web/src/product/surfaces/__tests__/da-w7-operator-visual-dae-signoff.test.tsx',
] as const;

/** Non-waivable sync for DA W7 VISUAL agent companions. */
export function assertDaW7OperatorVisualDaeSignoffSync(): void {
  if (DA_W7_OPERATOR_VISUAL_DAE_SIGNOFF_TODO !== 'da-w7-operator-visual-dae-signoff') {
    throw new Error('da-w7-visual: todo id drift');
  }

  if (DA_W7_VISUAL_PREREQUISITE_TODO !== 'da-w7-enforcement-strict-tokens') {
    throw new Error('da-w7-visual: prerequisite must be da-w7-enforcement-strict-tokens');
  }

  if (DA_W7_DAE_VISUAL_VIEWPORT_WIDTHS.length !== 4) {
    throw new Error('da-w7-visual: viewport smoke must be 390/768/1024/2560');
  }

  if (DA_W7_DAE_VISUAL_VIEWPORT_WIDTHS[3] !== 2560) {
    throw new Error('da-w7-visual: ultra 2560 required');
  }

  if (!DA_W7_DAE_VISUAL_ROUTES.includes('/home')) {
    throw new Error('da-w7-visual: /home required');
  }

  if (!DA_W7_DAE_VISUAL_ROUTES.includes('/trade')) {
    throw new Error('da-w7-visual: /trade required');
  }

  if (DA_W7_DAE_SPOT_CHECK_SURFACES.length !== 3) {
    throw new Error('da-w7-visual: Home+Shell+Trade surfaces required');
  }

  if (DA_W7_DAE_DEAD_CONTROL_TEST_IDS.length < 5) {
    throw new Error('da-w7-visual: dead-control test ids incomplete');
  }

  if (DA_W7_DAE_DESIGNER_CHECKLIST.length < 10) {
    throw new Error('da-w7-visual: designer checklist incomplete');
  }

  if (DA_W7_DAE_VISUAL_PREVIEW_DEPLOY_SCRIPT !== 'deploy:pages:web:preview') {
    throw new Error('da-w7-visual: preview deploy script drift');
  }

  if (!DA_W7_DAE_VISUAL_PREVIEW_URL.startsWith('https://preview.')) {
    throw new Error('da-w7-visual: preview URL must be preview host');
  }

  if (DA_W7_DAE_VISUAL_APPROVED_PHRASE !== 'VISUAL APPROVED: da-w7') {
    throw new Error('da-w7-visual: approved phrase drift');
  }

  if (DA_W7_DAE_VISUAL_TEST_PATHS.length !== 2) {
    throw new Error('da-w7-visual: owner test paths incomplete');
  }
}
