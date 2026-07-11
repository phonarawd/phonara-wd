import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  assertDaW8SignatureSurfacesSync,
  DA_W8_HOME_DAY_FLOW,
  DA_W8_HOME_DAY_FLOW_STEPS,
  DA_W8_SIGNATURE_ARTIFACT_PATHS,
  DA_W8_SIGNATURE_MOMENTS,
  DA_W8_SIGNATURE_SURFACES,
  DA_W8_SIGNATURE_SURFACES_BUNDLE_TODO,
  DA_W8_SIGNATURE_SURFACES_PREREQUISITE_TODOS,
  DA_W8_SIGNATURE_TEST_PATHS,
  DA_W8_SIGNATURE_WIRE_TARGETS,
  formatKickoffCountdownClock,
  P12_GATE_MARKETING_TODO,
  resolveHomeGreetingMessageKey,
  resolveHomeGreetingPeriod,
  resolveKickoffCountdown,
  resolveMarketHeatTone,
} from '../da-w8-signature-surfaces-display-contract';

const WEB_SRC = resolve(import.meta.dirname, '../..');
const REPO_ROOT = resolve(WEB_SRC, '../../..');

describe('da-w8-signature-surfaces-display-contract §34.21–34.26 · YAML #226', () => {
  it('registers BUNDLE todo · prerequisite GATE · 6 surfaces · day flow', () => {
    expect(DA_W8_SIGNATURE_SURFACES_BUNDLE_TODO).toBe('da-w8-signature-surfaces-bundle');
    expect(P12_GATE_MARKETING_TODO).toBe('p12-gate-marketing');
    expect(DA_W8_SIGNATURE_SURFACES_PREREQUISITE_TODOS).toEqual([P12_GATE_MARKETING_TODO]);
    expect(DA_W8_SIGNATURE_SURFACES).toEqual([
      'home',
      'wallet',
      'trade',
      'casino',
      'sports',
      'vip',
    ]);
    expect(DA_W8_SIGNATURE_MOMENTS).toEqual({
      home: 'greeting-day-flow',
      wallet: 'living-balance',
      trade: 'market-heat-volume-pulse',
      casino: 'tile-float-glow',
      sports: 'kickoff-countdown',
      vip: 'xp-fill',
    });
    expect(DA_W8_HOME_DAY_FLOW_STEPS).toEqual(['reward', 'tasks', 'market', 'events']);
    expect(DA_W8_HOME_DAY_FLOW.map((s) => s.id)).toEqual([...DA_W8_HOME_DAY_FLOW_STEPS]);
    expect(DA_W8_SIGNATURE_WIRE_TARGETS).toHaveLength(6);
    expect(() => assertDaW8SignatureSurfacesSync()).not.toThrow();
  });

  it('requires artifacts and owner test paths on disk', () => {
    for (const rel of DA_W8_SIGNATURE_ARTIFACT_PATHS) {
      expect(existsSync(resolve(WEB_SRC, rel))).toBe(true);
    }
    for (const rel of DA_W8_SIGNATURE_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel))).toBe(true);
    }
  });

  it('resolves greeting periods and market heat tones', () => {
    expect(resolveHomeGreetingPeriod(8)).toBe('morning');
    expect(resolveHomeGreetingPeriod(14)).toBe('afternoon');
    expect(resolveHomeGreetingPeriod(20)).toBe('evening');
    expect(resolveHomeGreetingMessageKey('morning')).toBe('earn.home.greeting.morning');
    expect(resolveMarketHeatTone('up')).toBe('up');
    expect(resolveMarketHeatTone(undefined)).toBe('neutral');
  });

  it('formats kickoff countdown display-only clocks', () => {
    expect(formatKickoffCountdownClock(65)).toBe('01:05');
    expect(formatKickoffCountdownClock(3661)).toBe('1:01:01');
    const future = resolveKickoffCountdown('2099-01-01T00:00:00.000Z', Date.parse('2098-12-31T23:00:00.000Z'));
    expect(future.kind).toBe('countdown');
    if (future.kind === 'countdown') {
      expect(future.totalSeconds).toBe(3600);
      expect(future.clock).toBe('1:00:00');
    }
    expect(resolveKickoffCountdown('2020-01-01T00:00:00.000Z', Date.now()).kind).toBe('started');
    expect(resolveKickoffCountdown('not-a-date', Date.now()).kind).toBe('invalid');
  });

  it('wires signature cues on home · wallet · trade · casino · sports · vip owners', () => {
    const home = readFileSync(resolve(WEB_SRC, 'product/surfaces/home/earn-home-page.tsx'), 'utf8');
    expect(home).toContain('data-signature="greeting-day-flow"');
    expect(home).toContain('DA_W8_HOME_DAY_FLOW');
    expect(home).toContain('earn-home-greeting');
    expect(home).toContain('fillOnMount');

    const wallet = readFileSync(
      resolve(WEB_SRC, 'product/surfaces/wallet/wallet-balance-hero.tsx'),
      'utf8',
    );
    expect(wallet).toContain('data-signature="living-balance"');
    expect(wallet).toContain('countUp');

    const trade = readFileSync(
      resolve(WEB_SRC, 'product/surfaces/trade/trade-market-ticker-stats.tsx'),
      'utf8',
    );
    expect(trade).toContain('data-signature="market-heat-volume-pulse"');
    expect(trade).toContain('data-market-heat');
    expect(trade).toContain('data-volume-pulse');

    const casino = readFileSync(
      resolve(WEB_SRC, 'product/surfaces/casino/casino-lobby-page.tsx'),
      'utf8',
    );
    expect(casino).toContain('data-signature="tile-float-glow"');
    expect(casino).toContain('casino-play');

    const sports = readFileSync(
      resolve(WEB_SRC, 'product/surfaces/sports/sports-fixture-board.tsx'),
      'utf8',
    );
    expect(sports).toContain('SportsKickoffCountdown');

    const kickoff = readFileSync(
      resolve(WEB_SRC, 'product/surfaces/sports/sports-kickoff-countdown.tsx'),
      'utf8',
    );
    expect(kickoff).toContain('data-signature="kickoff-countdown"');

    const vip = readFileSync(resolve(WEB_SRC, 'product/surfaces/tier/tier-me-page.tsx'), 'utf8');
    expect(vip).toContain('data-signature="xp-fill"');
    expect(vip).toContain('fillOnMount');
    expect(vip).toContain('useCountUp');

    const ring = readFileSync(resolve(WEB_SRC, 'product/primitives/progress-ring.tsx'), 'utf8');
    expect(ring).toContain('fillOnMount');

    const css = readFileSync(resolve(WEB_SRC, 'product/tokens/signature-surfaces.css'), 'utf8');
    expect(css).toContain('ds-volume-pulse');
    expect(css).toContain('ds-casino-tile-float');
    expect(css).toContain('prefers-reduced-motion');
  });
});
