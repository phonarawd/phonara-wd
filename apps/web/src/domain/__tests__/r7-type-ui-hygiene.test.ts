/**
 * R7 M-14/M-15/M-16 closeout contract — orphan paths gone · ratchet scripts present.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(import.meta.dirname, '../../../../../');

const ORPHANS = [
  'apps/web/src/product/surfaces/shell/domain-hub-page.tsx',
  'apps/web/src/product/surfaces/marketing/system-status-stub-page.tsx',
  'apps/web/src/product/surfaces/marketing/support-ticket-stub-page.tsx',
  'apps/admin/src/hooks/admin/useAdminAccessDesk.ts',
  'apps/admin/src/hooks/admin/useAdminAccessDeskMock.ts',
  'apps/admin/src/hooks/admin/useAdminGiftcardFeeMarket.ts',
  'apps/web/src/features/casino/casino-live-rpc.ts',
] as const;

describe('R7 type/UI hygiene (M-14 · M-15 · M-16)', () => {
  it('M-14 orphan surfaces/hooks are deleted', () => {
    for (const rel of ORPHANS) {
      expect(existsSync(join(root, rel)), rel).toBe(false);
    }
  });

  it('M-15 primitive ratchet script exists with baseline caps', () => {
    const src = readFileSync(join(root, 'scripts/check-primitive-ratchet.ts'), 'utf8');
    expect(src).toContain('BASELINE');
    expect(src).toContain('rawButton');
    expect(src).toContain('primitive-allow');
  });

  it('M-16 rpc type hygiene script forbids name-lie and sportsRpc', () => {
    const src = readFileSync(join(root, 'scripts/check-rpc-type-hygiene.ts'), 'utf8');
    expect(src).toContain('rpc-name-lie');
    expect(src).toContain('sportsRpc');
    expect(src).toContain('casinoLiveRpc');
  });

  it('order book uses token typography (no text-[11px])', () => {
    const panel = readFileSync(
      join(root, 'apps/web/src/product/surfaces/trade/spot-order-book-panel.tsx'),
      'utf8',
    );
    const depth = readFileSync(
      join(root, 'apps/web/src/product/surfaces/trade/order-book-depth-chart.tsx'),
      'utf8',
    );
    expect(panel).not.toContain('text-[11px]');
    expect(depth).not.toContain('text-[11px]');
    expect(panel).toContain('text-xs');
    expect(depth).toContain('text-xs');
  });

  it('chart-theme documents signed RGB fallback exception', () => {
    const src = readFileSync(
      join(root, 'apps/web/src/product/surfaces/trade/chart/chart-theme.ts'),
      'utf8',
    );
    expect(src).toContain('primitive-allow');
    expect(src).toContain('CHART_RGB_FALLBACKS');
  });
});
