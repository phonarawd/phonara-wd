import { describe, expect, it } from 'vitest';

import {
  assertHiQaInteractionCatalogSync,
  buildDragPath,
  HI_QA_INTERACTION_SCENARIOS,
  HI_QA_REQUIRED_KINDS,
} from '../../scripts/lib/visual-audit-hi-qa';

describe('visual-audit-hi-qa catalog', () => {
  it('covers drag · wheel · keyboard · touch · wheel+drag with unique ids', () => {
    expect(() => assertHiQaInteractionCatalogSync()).not.toThrow();
    expect(HI_QA_INTERACTION_SCENARIOS.length).toBeGreaterThanOrEqual(6);

    const kinds = new Set(HI_QA_INTERACTION_SCENARIOS.map((s) => s.kind));
    for (const required of HI_QA_REQUIRED_KINDS) {
      expect(kinds.has(required)).toBe(true);
    }

    const ids = HI_QA_INTERACTION_SCENARIOS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes plan Gap-4 owner surfaces (chart · slider · roulette · book · staking · slip · missions)', () => {
    const ids = new Set(HI_QA_INTERACTION_SCENARIOS.map((s) => s.id));
    expect(ids.has('chart-wheel-zoom-pan')).toBe(true);
    expect(ids.has('leverage-slider-drag')).toBe(true);
    expect(ids.has('roulette-chip-place')).toBe(true);
    expect(ids.has('order-book-wheel')).toBe(true);
    expect(ids.has('recent-trades-wheel')).toBe(true);
    expect(ids.has('staking-pool-keyboard')).toBe(true);
    expect(ids.has('mobile-slip-bottom-sheet')).toBe(true);
    expect(ids.has('missions-tab-touch')).toBe(true);
  });

  it('keeps mobile 390 touch scenarios for slip sheet + mission tabs', () => {
    const mobile = HI_QA_INTERACTION_SCENARIOS.filter((s) => s.viewport === '390');
    expect(mobile.map((s) => s.id).sort()).toEqual(
      ['missions-tab-touch', 'mobile-slip-bottom-sheet'].sort(),
    );
    expect(mobile.every((s) => s.kind === 'touch')).toBe(true);
  });

  it('buildDragPath yields inclusive endpoints and intermediate frames', () => {
    const path = buildDragPath({ x: 0, y: 0 }, { x: 100, y: 50 }, 4);
    expect(path[0]).toEqual({ x: 0, y: 0 });
    expect(path[path.length - 1]).toEqual({ x: 100, y: 50 });
    expect(path.length).toBe(5);
    expect(path[2]).toEqual({ x: 50, y: 25 });
  });
});
