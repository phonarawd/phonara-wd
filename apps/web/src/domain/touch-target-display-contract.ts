/**
 * Touch target contract — DESIGN_PRINCIPLES §6/§7 · zero-defect `fix-touch-target-48px`.
 *
 * Shared Button/IconButton must consume `--ds-touch-target-min` (48px) so every
 * surface that imports the primitive inherits the floor. Trade spot/futures
 * primary submit buttons also pin the same token class (not bare `min-h-11`).
 */

/** CSS custom property — keep in sync with `product/tokens/spacing.css`. */
export const DS_TOUCH_TARGET_MIN_TOKEN = '--ds-touch-target-min' as const;

/** Resolved minimum touch size in px (token value). */
export const DS_TOUCH_TARGET_MIN_PX = 48 as const;

/**
 * Tailwind v4 token utility classes that prove consumption
 * (not hardcoded `h-9` / `h-11` / `min-h-11`).
 */
export const DS_TOUCH_TARGET_HEIGHT_CLASS = `h-(${DS_TOUCH_TARGET_MIN_TOKEN})` as const;
export const DS_TOUCH_TARGET_MIN_HEIGHT_CLASS = `min-h-(${DS_TOUCH_TARGET_MIN_TOKEN})` as const;
export const DS_TOUCH_TARGET_SIZE_CLASS = `size-(${DS_TOUCH_TARGET_MIN_TOKEN})` as const;

/** Owner artifact paths for gate:ai-impl / source sync. */
export const TOUCH_TARGET_OWNER_PATHS = [
  'product/tokens/spacing.css',
  'product/primitives/button.tsx',
  'product/primitives/icon-button.tsx',
  'product/primitives/input.tsx',
  'product/primitives/select.tsx',
  'product/primitives/tabs.tsx',
  'product/primitives/help-tip.tsx',
  'product/surfaces/trade/spot-order-ticket.tsx',
  'product/surfaces/trade/futures-order-ticket.tsx',
  'product/surfaces/trade/trade-desk-mobile-sticky-cta.tsx',
  'product/surfaces/trade/chart/trade-chart-panel.tsx',
] as const;

/**
 * Dense-UI blast-radius risks after shared 48px Button/IconButton uplift
 * (`fix-touch-target-dense-ui-risk`). Repo-relative paths — admin table lives
 * outside `apps/web/src/product`.
 */
export const TOUCH_TARGET_DENSE_UI_RISK_PATHS = [
  'apps/web/src/product/primitives/help-tip.tsx',
  'apps/admin/src/product/primitives/admin-table.tsx',
  'apps/web/src/product/surfaces/trade/chart/trade-chart-panel.tsx',
  'apps/web/src/features/trading/order-ticket/margin-mode-segment.tsx',
  'apps/web/src/features/trading/order-ticket/position-mode-segment.tsx',
  'apps/web/src/features/trading/order-ticket/leverage-control.tsx',
  'apps/web/src/product/surfaces/games/bet-mode-tabs.tsx',
  'apps/web/src/product/primitives/select.tsx',
  'apps/web/src/product/primitives/input.tsx',
  'apps/web/src/product/primitives/tabs.tsx',
] as const;

/**
 * Full-route regression matrix for shared Button/IconButton blast radius.
 * Changing sm/md height affects every chapter — smoke these hubs after edits.
 */
export const TOUCH_TARGET_REGRESSION_MATRIX = [
  {
    chapter: 'earn',
    routes: ['/home', '/earn', '/referral', '/tier', '/onboarding', '/staking', '/share/earnings'],
    sizeImpact: 'sm+md',
    notes: 'missions · attendance · earn CTAs default md; secondary sm refresh · share earnings',
  },
  {
    chapter: 'wallet',
    routes: ['/wallet', '/ledger', '/rewards'],
    sizeImpact: 'sm+md',
    notes: 'deposit/withdraw hubs · ledger filters · redeem',
  },
  {
    chapter: 'trade',
    routes: ['/trade'],
    sizeImpact: 'sm+md+submit',
    notes: 'chart toolbar sm gap-2 · spot/futures submit min-h token · sticky CTA already ≥48',
  },
  {
    chapter: 'sports',
    routes: ['/sports'],
    sizeImpact: 'sm+md',
    notes: 'bet slip · cashout · fixture board',
  },
  {
    chapter: 'casino',
    routes: ['/casino', '/games'],
    sizeImpact: 'sm+md+lg',
    notes: 'lobby · game shell bet variant lg · mode tabs sm',
  },
  {
    chapter: 'auth',
    routes: ['/login', '/signup', '/reset-password', '/verify-email'],
    sizeImpact: 'md',
    notes: 'primary form submit defaults md',
  },
  {
    chapter: 'shell',
    routes: ['/*'],
    sizeImpact: 'sm+IconButton',
    notes: 'help-tip IconButton sm · confirm/empty/error panels · PWA banner',
  },
  {
    chapter: 'admin',
    routes: ['/'],
    sizeImpact: 'sm+md',
    notes: 'Admin Vite alias → same web Button · AdminTable rowActions nowrap + sort min-h',
  },
] as const;

export type TouchTargetRegressionChapter =
  (typeof TOUCH_TARGET_REGRESSION_MATRIX)[number]['chapter'];

/** Primary submit test ids that must carry the min-height token class. */
export const TOUCH_TARGET_TRADE_SUBMIT_TEST_IDS = ['spot-submit', 'futures-submit'] as const;

/** Forbidden pre-fix height utilities on Button size variants / trade submit. */
export const TOUCH_TARGET_FORBIDDEN_HEIGHT_CLASSES = [
  'h-9',
  'h-11',
  'min-h-9',
  'min-h-11',
  'size-8',
  'size-9',
  'size-11',
] as const;

export function assertTouchTargetDisplayContractSync(): void {
  if (DS_TOUCH_TARGET_MIN_PX !== 48) {
    throw new Error('touch-target: DS_TOUCH_TARGET_MIN_PX must remain 48');
  }

  if (DS_TOUCH_TARGET_MIN_TOKEN !== '--ds-touch-target-min') {
    throw new Error('touch-target: token name drift');
  }

  if (!DS_TOUCH_TARGET_HEIGHT_CLASS.includes(DS_TOUCH_TARGET_MIN_TOKEN)) {
    throw new Error('touch-target: height class must consume token');
  }

  if (!DS_TOUCH_TARGET_MIN_HEIGHT_CLASS.includes(DS_TOUCH_TARGET_MIN_TOKEN)) {
    throw new Error('touch-target: min-height class must consume token');
  }

  if (!DS_TOUCH_TARGET_SIZE_CLASS.includes(DS_TOUCH_TARGET_MIN_TOKEN)) {
    throw new Error('touch-target: size class must consume token');
  }

  if (TOUCH_TARGET_DENSE_UI_RISK_PATHS.length < 8) {
    throw new Error('touch-target: dense-ui risk paths incomplete');
  }

  if (!TOUCH_TARGET_OWNER_PATHS.includes('product/surfaces/trade/chart/trade-chart-panel.tsx')) {
    throw new Error('touch-target: chart panel must remain an owner path');
  }

  const chapters = TOUCH_TARGET_REGRESSION_MATRIX.map((row) => row.chapter);
  if (new Set(chapters).size !== chapters.length) {
    throw new Error('touch-target: regression chapters must be unique');
  }

  for (const required of [
    'earn',
    'wallet',
    'trade',
    'sports',
    'casino',
    'auth',
    'shell',
    'admin',
  ] as const) {
    if (!chapters.includes(required)) {
      throw new Error(`touch-target: missing regression chapter ${required}`);
    }
  }
}
