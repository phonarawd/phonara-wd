/**
 * Phase 2 Trade/Wallet exchange-grade polish + Human Interaction QA
 * (`phase2-trade-wallet` · `resume-phase2-trade-wallet`).
 *
 * Canon: TRADE_UX_CANON.md · WALLET_UX_CANON.md · DESIGN_PRINCIPLES touch floor.
 * Scope: presentation only — no RPC/controller signature changes.
 */

import {
  DS_TOUCH_TARGET_MIN_HEIGHT_CLASS,
  DS_TOUCH_TARGET_MIN_PX,
} from '@/domain/touch-target-display-contract';

export const PHASE2_TRADE_WALLET_TODO = 'phase2-trade-wallet' as const;
export const RESUME_PHASE2_TRADE_WALLET_TODO = 'resume-phase2-trade-wallet' as const;

/** Spot → Futures → Wallet → HI-QA execution order (non-waivable). */
export const PHASE2_TRADE_WALLET_PART_ORDER = ['spot', 'futures', 'wallet', 'hi-qa'] as const;

export type Phase2TradeWalletPart = (typeof PHASE2_TRADE_WALLET_PART_ORDER)[number];

/** Owner surfaces/primitives touched by this polish pass. */
export const PHASE2_TRADE_WALLET_OWNER_PATHS = [
  'product/primitives/help-tip.tsx',
  'product/primitives/input.tsx',
  'product/primitives/select.tsx',
  'product/primitives/tabs.tsx',
  'product/surfaces/trade/spot-desk-page.tsx',
  'product/surfaces/trade/futures-desk-page.tsx',
  'product/surfaces/trade/trade-desk-mobile-sticky-cta.tsx',
  'product/surfaces/trade/trade-desk-mobile-tabs.tsx',
  'product/surfaces/trade/trade-desk-bottom-dock.tsx',
  'product/surfaces/trade/spot-order-book-panel.tsx',
  'product/surfaces/trade/trade-recent-trades-rail.tsx',
  'product/surfaces/trade/futures-order-ticket.tsx',
  'product/surfaces/trade/futures-positions-panel.tsx',
  'product/surfaces/wallet/wallet-page.tsx',
  'product/surfaces/wallet/wallet-compliance-strip.tsx',
  'product/surfaces/wallet/withdraw-hub-page.tsx',
  'product/surfaces/wallet/wallet-redeem-page.tsx',
] as const;

/**
 * Human Interaction QA matrix — drag/wheel-heavy Trade desk + Wallet CTAs.
 * Source-level contracts below prove wiring; real-browser 390/768/1024/2560
 * capture remains operator/CDP evidence (G13 — no agent-local E2E).
 */
export const PHASE2_TRADE_WALLET_HI_QA_MATRIX = [
  {
    id: 'chart-wheel-zoom-pan',
    surface: 'trade-chart',
    interaction: 'wheel+drag',
    ownerHint: 'chart/chart-options.ts chartInteractionOptions',
    pass: 'mouseWheel zoom/pan + horzTouchDrag enabled',
  },
  {
    id: 'order-book-view-toggle',
    surface: 'spot-order-book',
    interaction: 'tap+keyboard',
    ownerHint: 'spot-order-book-panel.tsx Book/Depth tabs',
    pass: `min-h token ${DS_TOUCH_TARGET_MIN_PX}px + focus-visible ring`,
  },
  {
    id: 'recent-trades-scroll',
    surface: 'trade-recent-trades',
    interaction: 'wheel+touch-scroll',
    ownerHint: 'trade-recent-trades-rail.tsx overscroll-contain',
    pass: 'scroll contained; collapse toggle uses IconButton 48px',
  },
  {
    id: 'leverage-slider-drag',
    surface: 'futures-ticket',
    interaction: 'drag',
    ownerHint: 'leverage-control.tsx Slider thumb size-12',
    pass: '48px thumb; presets remain Button token height',
  },
  {
    id: 'tablet-external-submit',
    surface: 'spot+futures desk',
    interaction: 'tap',
    ownerHint: 'primarySubmit="external" + sticky CTA',
    pass: 'single Buy/Sell submit on tablet (no duplicate inline)',
  },
  {
    id: 'mobile-ticket-fold-open',
    surface: 'trade-mobile',
    interaction: 'tap',
    ownerHint: 'trade-desk-mobile-tabs.tsx CollapsibleSection',
    pass: 'ticket fold defaultOpen — fewer chrome layers before amount',
  },
  {
    id: 'wallet-kyc-escape',
    surface: 'wallet',
    interaction: 'tap',
    ownerHint: 'compliance strip · withdraw hub · redeem',
    pass: 'KYC CTA href=/account/kyc when withdrawal not ready',
  },
  {
    id: 'wallet-locked-summary',
    surface: 'wallet-hero',
    interaction: 'read',
    ownerHint: 'wallet-page.tsx detailsSummary',
    pass: 'locked amount visible while Fold3 collapsed',
  },
] as const;

export type Phase2TradeWalletHiQaId = (typeof PHASE2_TRADE_WALLET_HI_QA_MATRIX)[number]['id'];

/** Viewport smoke widths — canonical 4-tier (do not extend with 3440+). */
export const PHASE2_TRADE_WALLET_VIEWPORT_WIDTHS = [390, 768, 1024, 2560] as const;

export const PHASE2_TRADE_WALLET_THEMES = ['light', 'dark'] as const;

/** Sticky CTA test ids must consume touch-target min-height token. */
export const PHASE2_MOBILE_STICKY_SUBMIT_TEST_IDS = [
  'spot-mobile-sticky-submit',
  'futures-mobile-sticky-submit',
] as const;

/** Source markers proving tablet ticket uses external submit. */
export const PHASE2_TABLET_EXTERNAL_SUBMIT_MARKERS = [
  'primarySubmit="external"',
  'SpotMobileStickyCta',
  'FuturesMobileStickyCta',
] as const;

/** Wallet KYC escape hatches that must point at /account/kyc. */
export const PHASE2_WALLET_KYC_CTA_TEST_IDS = [
  'wallet-compliance-kyc-cta',
  'withdraw-hub-kyc-cta',
  'wallet-redeem-kyc-cta',
] as const;

export function assertTradeWalletPhase2PolishContractSync(): void {
  if (PHASE2_TRADE_WALLET_PART_ORDER.length !== 4) {
    throw new Error('phase2-trade-wallet: part order must be spot→futures→wallet→hi-qa');
  }

  if (PHASE2_TRADE_WALLET_PART_ORDER[0] !== 'spot') {
    throw new Error('phase2-trade-wallet: Spot must run first');
  }

  if (PHASE2_TRADE_WALLET_HI_QA_MATRIX.length < 6) {
    throw new Error('phase2-trade-wallet: HI-QA matrix incomplete');
  }

  const hiIds = PHASE2_TRADE_WALLET_HI_QA_MATRIX.map((row) => row.id);
  if (new Set(hiIds).size !== hiIds.length) {
    throw new Error('phase2-trade-wallet: HI-QA ids must be unique');
  }

  if (!PHASE2_TRADE_WALLET_VIEWPORT_WIDTHS.includes(390)) {
    throw new Error('phase2-trade-wallet: mobile 390 required');
  }

  if (PHASE2_TRADE_WALLET_VIEWPORT_WIDTHS.length !== 4) {
    throw new Error('phase2-trade-wallet: keep 4-tier smoke widths (no ultrawide push)');
  }

  if (!DS_TOUCH_TARGET_MIN_HEIGHT_CLASS.includes('--ds-touch-target-min')) {
    throw new Error('phase2-trade-wallet: sticky CTA must share touch-target token class');
  }
}
