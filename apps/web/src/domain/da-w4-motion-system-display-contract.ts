/**
 * DA W4 Motion system BUNDLE (§34.15–34.16 · YAML #192).
 * Authority: `da-w4-motion-system-bundle` · PRODUCT_EXPERIENCE_CANON §5 · UNIFIED_UX_CANON §4.
 */

export const DA_W4_MOTION_SYSTEM_BUNDLE_TODO = 'da-w4-motion-system-bundle' as const;

export const DA_W3_GATE_IA_PROGRESSIVE_TODO = 'da-w3-gate-ia-progressive' as const;

/** Prerequisite GATE must be closed before this BUNDLE. */
export const DA_W4_MOTION_SYSTEM_PREREQUISITE_TODOS = [DA_W3_GATE_IA_PROGRESSIVE_TODO] as const;

/** Motion tiers — L2 financial submit = instant only (§34.15). */
export const DA_W4_MOTION_TIERS = ['L0', 'L1', 'L2'] as const;

export type DaW4MotionTier = (typeof DA_W4_MOTION_TIERS)[number];

/** Signal Pulse count-up budget (ms) — L1 max · mirrors MOTION_MS.countUp. */
export const DA_W4_COUNT_UP_MAX_MS = 400 as const;

/** Surfaces that wire useCountUp (balance · XP · PnL). */
export const DA_W4_COUNT_UP_WIRE_TARGETS = ['wallet_balance', 'earn_xp', 'trade_pnl'] as const;

export type DaW4CountUpWireTarget = (typeof DA_W4_COUNT_UP_WIRE_TARGETS)[number];

/** L2 financial contexts — count-up must resolve instant (no decorative delay). */
export const DA_W4_L2_FINANCIAL_CONTEXTS = [
  'withdraw',
  'bet_submit',
  'trade_submit',
  'admin_money_adjust',
] as const;

/** On-disk artifacts required for W4 motion BUNDLE. */
export const DA_W4_MOTION_SYSTEM_ARTIFACT_PATHS = [
  'domain/da-w4-motion-system-display-contract.ts',
  'product/primitives/lib/use-count-up.ts',
  'product/primitives/lib/motion-tier.ts',
  'product/primitives/money-display.tsx',
  'product/surfaces/wallet/wallet-balance-hero.tsx',
  'product/surfaces/home/earn-home-page.tsx',
  'product/surfaces/trade/futures-positions-panel.tsx',
  'product/tokens/motion.ts',
  'product/tokens/motion.css',
] as const;

/** gate:ai-impl owner paths — motion contract + count-up consumers. */
export const DA_W4_MOTION_SYSTEM_TEST_PATHS = [
  'apps/web/src/domain/__tests__/da-w4-motion-system-display-contract.test.ts',
  'apps/web/src/product/primitives/__tests__/use-count-up.test.ts',
  'apps/web/src/product/primitives/__tests__/motion-presets.test.ts',
  'apps/web/src/product/primitives/__tests__/money-display.test.tsx',
  'apps/web/src/product/surfaces/wallet/__tests__/wallet-page.test.tsx',
  'apps/web/src/product/surfaces/home/__tests__/earn-home-page.test.tsx',
  'apps/web/src/product/surfaces/trade/__tests__/futures-positions-panel.test.tsx',
] as const;

/** Non-waivable sync for DA W4 BUNDLE closeout. */
export function assertDaW4MotionSystemSync(): void {
  if (DA_W4_COUNT_UP_MAX_MS !== 400) {
    throw new Error('da-w4-motion-system-bundle: count-up max must be 400ms');
  }

  if (DA_W4_COUNT_UP_WIRE_TARGETS.length !== 3) {
    throw new Error('da-w4-motion-system-bundle: wire balance · XP · PnL (3 targets)');
  }

  if (!DA_W4_MOTION_SYSTEM_PREREQUISITE_TODOS.includes(DA_W3_GATE_IA_PROGRESSIVE_TODO)) {
    throw new Error('da-w4-motion-system-bundle: missing prerequisite da-w3-gate-ia-progressive');
  }

  if (!DA_W4_MOTION_TIERS.includes('L2')) {
    throw new Error('da-w4-motion-system-bundle: L2 financial tier required');
  }
}
