import { describe, expect, it } from 'vitest';

import {
  P9_DUAL_CURRENCY_SPOT_CHECK_SURFACES,
  P9_OPERATOR_VISUAL_SIGNOFF_TODO,
  P9_TRADE_DEAD_CONTROL_TEST_IDS,
  P9_TRADE_DESIGNER_CHECKLIST,
  P9_TRADE_VISUAL_PREVIEW_DEPLOY_SCRIPT,
  P9_TRADE_VISUAL_PREVIEW_URL,
  P9_TRADE_VISUAL_ROUTES,
  P9_TRADE_VISUAL_VIEWPORT_WIDTHS,
  P9_VISUAL_STAKING_ROUTES,
} from '../p9-trade-visual-signoff-display-contract';

describe('p9-trade-visual-signoff-display-contract §20.12 · §22.2.2', () => {
  it('binds VISUAL todo id to plan YAML', () => {
    expect(P9_OPERATOR_VISUAL_SIGNOFF_TODO).toBe('p9-operator-visual-signoff');
  });

  it('requires 4-tier viewport smoke (390/768/1024/2560)', () => {
    expect(P9_TRADE_VISUAL_VIEWPORT_WIDTHS).toEqual([390, 768, 1024, 2560]);
  });

  it('covers /trade hub + P9 manifest + staking routes', () => {
    expect(P9_TRADE_VISUAL_ROUTES).toEqual([
      '/trade',
      '/trade/futures',
      '/trade/positions',
      '/trade/orders',
      '/staking',
      '/staking/positions',
    ]);
    expect(P9_TRADE_VISUAL_ROUTES).toContain('/trade/futures');
    expect(P9_TRADE_VISUAL_ROUTES).toContain('/staking');
    expect(P9_VISUAL_STAKING_ROUTES).toEqual(['/staking', '/staking/positions']);
  });

  it('lists G1–G7 + dual currency checklist companions', () => {
    expect(P9_TRADE_DESIGNER_CHECKLIST.length).toBeGreaterThanOrEqual(15);
    expect(P9_TRADE_DESIGNER_CHECKLIST).toContain('g7-tier-b-hedge-hidden');
    expect(P9_TRADE_DESIGNER_CHECKLIST).toContain('dual-currency-usdt-phon-selector');
    expect(P9_DUAL_CURRENCY_SPOT_CHECK_SURFACES.length).toBeGreaterThanOrEqual(4);
  });

  it('declares dead-control test ids and preview deploy script', () => {
    expect(P9_TRADE_DEAD_CONTROL_TEST_IDS.length).toBeGreaterThanOrEqual(3);
    expect(P9_TRADE_VISUAL_PREVIEW_DEPLOY_SCRIPT).toBe('deploy:pages:web:preview');
    expect(P9_TRADE_VISUAL_PREVIEW_URL).toMatch(/^https:\/\/preview\./);
  });
});
