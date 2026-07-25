/**
 * Human Interaction QA (HI-QA) scenario catalog for the Chrome CDP visual audit.
 *
 * Runtime execution lives in `scripts/visual-audit-capture-cdp.ts` under
 * `PHONARA_AUDIT_INTERACT=1` (no Playwright — G5). This module is the
 * declarative matrix so vitest can assert coverage without spinning Chrome.
 *
 * Matrix source (plan `add-hi-qa-interaction-pass`):
 *   drag  — chart wheel/zoom · leverage slider · roulette chip place
 *   wheel — order book · recent-trades
 *   keyboard — staking role=button + tab order
 *   touch — mobile slip sheet · mission tabs
 */

export type HiQaInteractionKind = 'drag' | 'wheel' | 'keyboard' | 'touch' | 'wheel+drag';

export type HiQaViewportId = '390' | '1024';

export type HiQaScenario = {
  id: string;
  surface: string;
  path: string;
  viewport: HiQaViewportId;
  kind: HiQaInteractionKind;
  /** Primary data-testid / selector owner for the interaction target. */
  ownerTestId: string;
  /** One-line pass criterion (evidence note in capture-manifest). */
  pass: string;
};

/**
 * Opt-in INTERACT pass HI-QA matrix — keep in sync with phase2/3/4 HI-QA
 * contract ids where they overlap (chart/order-book/leverage/slip/missions/staking).
 */
export const HI_QA_INTERACTION_SCENARIOS = [
  {
    id: 'chart-wheel-zoom-pan',
    surface: 'trade-chart',
    path: '/trade',
    viewport: '1024',
    kind: 'wheel+drag',
    ownerTestId: 'trade-lightweight-chart',
    pass: 'CDP mouseWheel + horz drag over lightweight-charts host',
  },
  {
    id: 'order-book-wheel',
    surface: 'spot-order-book',
    path: '/trade',
    viewport: '1024',
    kind: 'wheel',
    ownerTestId: 'spot-order-book-panel',
    pass: 'CDP mouseWheel over order book + Book/Depth tab tap',
  },
  {
    id: 'recent-trades-wheel',
    surface: 'trade-recent-trades',
    path: '/trade',
    viewport: '1024',
    kind: 'wheel',
    ownerTestId: 'trade-recent-trades-rail',
    pass: 'CDP mouseWheel over recent-trades scroll region',
  },
  {
    id: 'leverage-slider-drag',
    surface: 'futures-ticket',
    path: '/trade/futures',
    viewport: '1024',
    kind: 'drag',
    ownerTestId: 'leverage-slider',
    pass: 'CDP thumb drag on leverage Slider; value text changes or thumb moves',
  },
  {
    id: 'roulette-chip-place',
    surface: 'casino-roulette',
    path: '/games/roulette',
    viewport: '1024',
    kind: 'drag',
    ownerTestId: 'casino-roulette-chip-rack',
    pass: 'CDP chip select + pocket click (chip placement sequence)',
  },
  {
    id: 'staking-pool-keyboard',
    surface: 'staking',
    path: '/staking',
    viewport: '1024',
    kind: 'keyboard',
    ownerTestId: 'staking-hub-page',
    pass: 'Tab to staking-pool-* role=button then Enter/Space selects',
  },
  {
    id: 'mobile-slip-bottom-sheet',
    surface: 'sports-slip',
    path: '/sports',
    viewport: '390',
    kind: 'touch',
    ownerTestId: 'sports-slip-mobile-open',
    pass: 'Mobile open bar tap reveals sports-slip-mobile-sheet',
  },
  {
    id: 'missions-tab-touch',
    surface: 'home-missions',
    path: '/home/missions',
    viewport: '390',
    kind: 'touch',
    ownerTestId: 'home-missions-tabs',
    pass: 'Mobile mission tab tap toggles aria-selected',
  },
] as const satisfies readonly HiQaScenario[];

export type HiQaScenarioId = (typeof HI_QA_INTERACTION_SCENARIOS)[number]['id'];

/** Required kind coverage for Gap 4 (plan non-waivable). */
export const HI_QA_REQUIRED_KINDS: readonly HiQaInteractionKind[] = [
  'drag',
  'wheel',
  'keyboard',
  'touch',
  'wheel+drag',
];

export type HiQaPassResult = {
  id: HiQaScenarioId | string;
  surface: string;
  kind: HiQaInteractionKind;
  path: string;
  viewport: HiQaViewportId;
  steps: Record<string, unknown>;
  ok: boolean;
  screenshot: string | null;
  consoleErrors: string[];
};

export function assertHiQaInteractionCatalogSync(): void {
  if (HI_QA_INTERACTION_SCENARIOS.length < 6) {
    throw new Error('hi-qa: scenario catalog incomplete (<6)');
  }

  const ids = HI_QA_INTERACTION_SCENARIOS.map((s) => s.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error('hi-qa: scenario ids must be unique');
  }

  const kinds = new Set(HI_QA_INTERACTION_SCENARIOS.map((s) => s.kind));
  for (const required of HI_QA_REQUIRED_KINDS) {
    if (!kinds.has(required)) {
      throw new Error(`hi-qa: missing required kind ${required}`);
    }
  }

  const hasMobile = HI_QA_INTERACTION_SCENARIOS.some((s) => s.viewport === '390');
  if (!hasMobile) {
    throw new Error('hi-qa: at least one 390 mobile touch scenario required');
  }
}

/** Pure helper — build a linear drag path for CDP mouseMoved frames. */
export function buildDragPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  steps = 6,
): Array<{ x: number; y: number }> {
  const n = Math.max(2, Math.floor(steps));
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i <= n; i += 1) {
    const t = i / n;
    points.push({
      x: Math.round(from.x + (to.x - from.x) * t),
      y: Math.round(from.y + (to.y - from.y) * t),
    });
  }
  return points;
}
