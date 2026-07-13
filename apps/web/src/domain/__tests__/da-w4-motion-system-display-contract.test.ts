import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  assertDaW4MotionSystemSync,
  DA_W3_GATE_IA_PROGRESSIVE_TODO,
  DA_W4_COUNT_UP_MAX_MS,
  DA_W4_COUNT_UP_WIRE_TARGETS,
  DA_W4_L2_FINANCIAL_CONTEXTS,
  DA_W4_MOTION_SYSTEM_ARTIFACT_PATHS,
  DA_W4_MOTION_SYSTEM_BUNDLE_TODO,
  DA_W4_MOTION_SYSTEM_PREREQUISITE_TODOS,
  DA_W4_MOTION_SYSTEM_TEST_PATHS,
  DA_W4_MOTION_TIERS,
} from '../da-w4-motion-system-display-contract';
import { MOTION_MS } from '@/product/tokens/motion';
import {
  allowsCountUpMotion,
  resolveCountUpDurationMs,
} from '@/product/primitives/lib/motion-tier';

const WEB_SRC = resolve(import.meta.dirname, '../..');
const REPO_ROOT = resolve(WEB_SRC, '../../..');

describe('da-w4-motion-system-display-contract §34.15–34.16 · YAML #192', () => {
  it('registers BUNDLE todo · prerequisite GATE · count-up ≤400ms', () => {
    expect(DA_W4_MOTION_SYSTEM_BUNDLE_TODO).toBe('da-w4-motion-system-bundle');
    expect(DA_W4_MOTION_SYSTEM_PREREQUISITE_TODOS).toEqual([DA_W3_GATE_IA_PROGRESSIVE_TODO]);
    expect(DA_W4_COUNT_UP_MAX_MS).toBe(400);
    expect(MOTION_MS.countUp).toBe(DA_W4_COUNT_UP_MAX_MS);
    expect(DA_W4_COUNT_UP_WIRE_TARGETS).toEqual(['wallet_balance', 'earn_xp', 'trade_pnl']);
    expect(DA_W4_MOTION_TIERS).toEqual(['L0', 'L1', 'L2']);
    expect(DA_W4_L2_FINANCIAL_CONTEXTS).toContain('withdraw');
    expect(() => assertDaW4MotionSystemSync()).not.toThrow();
  });

  it('L2 and reduced-motion collapse count-up to instant', () => {
    expect(allowsCountUpMotion('L1', false)).toBe(true);
    expect(allowsCountUpMotion('L0', false)).toBe(true);
    expect(allowsCountUpMotion('L2', false)).toBe(false);
    expect(allowsCountUpMotion('L1', true)).toBe(false);
    expect(resolveCountUpDurationMs('L1', false)).toBe(400);
    expect(resolveCountUpDurationMs('L2', false)).toBe(0);
    expect(resolveCountUpDurationMs('L1', true)).toBe(0);
  });

  it('requires motion artifacts and owner test paths on disk', () => {
    for (const rel of DA_W4_MOTION_SYSTEM_ARTIFACT_PATHS) {
      expect(existsSync(resolve(WEB_SRC, rel))).toBe(true);
    }
    for (const rel of DA_W4_MOTION_SYSTEM_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel))).toBe(true);
    }
  });

  it('wires countUp on wallet hero · earn XP · futures PnL sources', () => {
    const wallet = readFileSync(
      resolve(WEB_SRC, 'product/surfaces/wallet/wallet-balance-hero.tsx'),
      'utf8',
    );
    expect(wallet).toMatch(/countUp\b/);

    const home = readFileSync(resolve(WEB_SRC, 'product/surfaces/home/earn-home-page.tsx'), 'utf8');
    expect(home).toContain('useCountUp');
    expect(home).toContain('earn-home-tier-xp');

    const futures = readFileSync(
      resolve(WEB_SRC, 'product/surfaces/trade/futures-positions-panel.tsx'),
      'utf8',
    );
    expect(futures).toMatch(/PositionPnlMoney[\s\S]*countUp/);

    const money = readFileSync(resolve(WEB_SRC, 'product/primitives/money-display.tsx'), 'utf8');
    expect(money).toContain('useCountUp');
    expect(money).toContain('data-count-up');

    const motionCss = readFileSync(resolve(WEB_SRC, 'product/tokens/motion.css'), 'utf8');
    expect(motionCss).toContain('--ds-motion-count-up: 400ms');
    expect(motionCss).toContain('--ds-motion-count-up: 0ms');
  });
});
