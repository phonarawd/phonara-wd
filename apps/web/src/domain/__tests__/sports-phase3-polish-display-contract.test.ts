import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { PQA_DEAD_CONTROL_DEFER_REGISTRY } from '../dead-controls-display-contract';
import {
  assertSportsPhase3PolishContractSync,
  PHASE3_SPORTS_HI_QA_MATRIX,
  PHASE3_SPORTS_LEAGUE_DESKTOP_TEST_ID,
  PHASE3_SPORTS_LEAGUE_MOBILE_TEST_ID,
  PHASE3_SPORTS_MOBILE_LEAGUE_MARKERS,
  PHASE3_SPORTS_MOBILE_SLIP_MARKERS,
  PHASE3_SPORTS_MOBILE_SLIP_OPEN_TEST_ID,
  PHASE3_SPORTS_OWNER_PATHS,
  PHASE3_SPORTS_PART_ORDER,
  PHASE3_SPORTS_VIP_DEAD_CONTROL_ID,
  PHASE3_SPORTS_VIEWPORT_WIDTHS,
} from '../sports-phase3-polish-display-contract';
import { DS_TOUCH_TARGET_MIN_HEIGHT_CLASS } from '../touch-target-display-contract';

const productRoot = resolve(import.meta.dirname, '../../product');
const domainRoot = resolve(import.meta.dirname, '..');

function readProduct(relativePath: string): string {
  return readFileSync(resolve(productRoot, relativePath.replace(/^product\//, '')), 'utf8');
}

function readDomain(relativePath: string): string {
  return readFileSync(resolve(domainRoot, relativePath), 'utf8');
}

describe('sports-phase3-polish-display-contract', () => {
  it('keeps VIP-first part order and 4-tier viewports', () => {
    expect(() => assertSportsPhase3PolishContractSync()).not.toThrow();
    expect(PHASE3_SPORTS_PART_ORDER).toEqual([
      'vip-reverify',
      'layout-density',
      'mobile-slip-sheet',
      'hi-qa',
    ]);
    expect(PHASE3_SPORTS_VIEWPORT_WIDTHS).toEqual([390, 768, 1024, 2560]);
    expect(PHASE3_SPORTS_HI_QA_MATRIX.length).toBeGreaterThanOrEqual(6);
    expect(PHASE3_SPORTS_OWNER_PATHS.length).toBeGreaterThanOrEqual(4);
  });

  it('re-verifies sports-vip-coming-soon mitigatedBy=live', () => {
    const vip = PQA_DEAD_CONTROL_DEFER_REGISTRY.find(
      (row) => row.id === PHASE3_SPORTS_VIP_DEAD_CONTROL_ID,
    );
    expect(vip?.mitigatedBy).toBe('live');
    expect(vip?.route).toBe('/sports/vip');

    const vipPanel = readProduct('surfaces/sports/sports-vip-panel.tsx');
    expect(vipPanel).toContain('sports-vip-eligibility-strip');
    expect(vipPanel).toContain('canBrowseSportsVipMarkets');
    expect(vipPanel).toContain('isSportsVipEligibleTier');
  });

  it('collapses desktop grid tracks when league rail or slip is absent', () => {
    const source = readProduct('surfaces/sports/sports-page.tsx');
    expect(source).toContain('resolveSportsHubGridClass');
    expect(source).toContain('showLeagueRail');
    expect(source).toContain('showSlip');
    // Must not hardcode a permanent 3-track template on the hub root.
    expect(source).not.toMatch(
      /ds-sports-hub[^`]*lg:grid-cols-\[minmax\(0,12rem\)_minmax\(0,1fr\)_minmax\(0,18rem\)\]/,
    );
  });

  it('mobile league filter uses horizontal chip scroller with distinct test ids', () => {
    const source = readProduct('surfaces/sports/sports-page.tsx');
    for (const marker of PHASE3_SPORTS_MOBILE_LEAGUE_MARKERS) {
      expect(source).toContain(marker);
    }
    expect(source).toContain(PHASE3_SPORTS_LEAGUE_DESKTOP_TEST_ID);
    expect(source).toContain(PHASE3_SPORTS_LEAGUE_MOBILE_TEST_ID);
    expect(source).not.toContain('data-testid="sports-league-rail"');
  });

  it('mobile slip opens via sticky bar into a bottom sheet', () => {
    const source = readProduct('surfaces/sports/sports-page.tsx');
    for (const marker of PHASE3_SPORTS_MOBILE_SLIP_MARKERS) {
      expect(source).toContain(marker);
    }
    expect(source).toContain(DS_TOUCH_TARGET_MIN_HEIGHT_CLASS);
    expect(source).toContain(PHASE3_SPORTS_MOBILE_SLIP_OPEN_TEST_ID);
  });

  it('bet slip header wires collapsed HelpTip howto', () => {
    const source = readProduct('surfaces/sports/sports-bet-slip-panel.tsx');
    expect(source).toContain('HelpTip');
    expect(source).toContain('sports.slip.oddsGloss');
    expect(source).not.toContain('SurfacePlainLanguageStrip');
  });

  it('sports hub root guards horizontal overflow', () => {
    const css = readProduct('tokens/layout.css');
    expect(css).toMatch(/\.ds-sports-hub\s*\{[^}]*overflow-x:\s*hidden/s);
    expect(readDomain('sports-phase3-polish-display-contract.ts')).toContain('overflow-x hidden');
  });
});
