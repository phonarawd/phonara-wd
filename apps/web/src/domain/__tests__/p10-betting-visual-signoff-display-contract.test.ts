import { describe, expect, it } from 'vitest';
import { GAME_CODES } from '@phonara/game-engine';

import { casinoLobbyGamePath } from '../casino-lobby-display-contract';
import { DA_W5_DOMAIN_CARD_SIGNATURES } from '../da-w5-cards-domain-variants-display-contract';
import {
  assertP10BettingVisualSignoffSync,
  P10_BETTING_DEAD_CONTROL_TEST_IDS,
  P10_BETTING_DESIGNER_CHECKLIST,
  P10_BETTING_VISUAL_PREVIEW_DEPLOY_SCRIPT,
  P10_BETTING_VISUAL_PREVIEW_URL,
  P10_BETTING_VISUAL_ROUTES,
  P10_BETTING_VISUAL_TEST_PATHS,
  P10_BETTING_VISUAL_VIEWPORT_WIDTHS,
  P10_DUAL_CURRENCY_SPOT_CHECK_SURFACES,
  P10_OPERATOR_VISUAL_SIGNOFF_TODO,
  P10_VISUAL_DOMAIN_CARD_VARIANTS,
  P10_VISUAL_PREREQUISITE_TODO,
} from '../p10-betting-visual-signoff-display-contract';

describe('p10-betting-visual-signoff-display-contract §20.12 · §22.2 Sports+Casino', () => {
  it('binds VISUAL todo id and prerequisite GATE', () => {
    expect(P10_OPERATOR_VISUAL_SIGNOFF_TODO).toBe('p10-operator-visual-signoff');
    expect(P10_VISUAL_PREREQUISITE_TODO).toBe('p10-gate-betting');
  });

  it('requires 3-tier viewport smoke (390/768/1024)', () => {
    expect(P10_BETTING_VISUAL_VIEWPORT_WIDTHS).toEqual([390, 768, 1024]);
  });

  it('covers /sports hub + casino + fairness + 12 game routes', () => {
    expect(P10_BETTING_VISUAL_ROUTES).toContain('/sports');
    expect(P10_BETTING_VISUAL_ROUTES).toContain('/sports/live');
    expect(P10_BETTING_VISUAL_ROUTES).toContain('/sports/my-bets');
    expect(P10_BETTING_VISUAL_ROUTES).toContain('/casino');
    expect(P10_BETTING_VISUAL_ROUTES).toContain('/casino/fairness');
    expect(GAME_CODES).toHaveLength(12);
    for (const code of GAME_CODES) {
      expect(P10_BETTING_VISUAL_ROUTES).toContain(casinoLobbyGamePath(code));
    }
  });

  it('lists §22.2 checklist + §34.17 domain cards + dual currency', () => {
    expect(P10_BETTING_DESIGNER_CHECKLIST.length).toBeGreaterThanOrEqual(12);
    expect(P10_BETTING_DESIGNER_CHECKLIST).toContain('sports-odds-card-variant');
    expect(P10_BETTING_DESIGNER_CHECKLIST).toContain('casino-play-card-variant');
    expect(P10_BETTING_DESIGNER_CHECKLIST).toContain('casino-12-game-stages');
    expect(P10_VISUAL_DOMAIN_CARD_VARIANTS).toEqual(['sports-odds', 'casino-play']);
    expect(DA_W5_DOMAIN_CARD_SIGNATURES['sports-odds']).toBe('heatmap-movement-bg');
    expect(DA_W5_DOMAIN_CARD_SIGNATURES['casino-play']).toBe('hover-glow-float');
    expect(P10_DUAL_CURRENCY_SPOT_CHECK_SURFACES).toContain('sports-stake-currency-selector');
    expect(P10_DUAL_CURRENCY_SPOT_CHECK_SURFACES).toContain('casino-stake-currency');
  });

  it('declares dead-control test ids and preview deploy script', () => {
    expect(P10_BETTING_DEAD_CONTROL_TEST_IDS.length).toBeGreaterThanOrEqual(8);
    expect(P10_BETTING_DEAD_CONTROL_TEST_IDS).toContain('sports-slip-place-bet');
    expect(P10_BETTING_DEAD_CONTROL_TEST_IDS).toContain('casino-place-bet');
    expect(P10_BETTING_VISUAL_PREVIEW_DEPLOY_SCRIPT).toBe('deploy:pages:web:preview');
    expect(P10_BETTING_VISUAL_PREVIEW_URL).toMatch(/^https:\/\/preview\./);
    expect(P10_BETTING_VISUAL_TEST_PATHS.length).toBe(2);
  });

  it('assertP10BettingVisualSignoffSync passes', () => {
    expect(() => assertP10BettingVisualSignoffSync()).not.toThrow();
  });
});
