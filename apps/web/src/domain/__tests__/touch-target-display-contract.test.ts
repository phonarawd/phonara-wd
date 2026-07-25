import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buttonVariants } from '@/product/primitives/button';

import {
  assertTouchTargetDisplayContractSync,
  DS_TOUCH_TARGET_HEIGHT_CLASS,
  DS_TOUCH_TARGET_MIN_HEIGHT_CLASS,
  DS_TOUCH_TARGET_MIN_PX,
  DS_TOUCH_TARGET_MIN_TOKEN,
  DS_TOUCH_TARGET_SIZE_CLASS,
  TOUCH_TARGET_FORBIDDEN_HEIGHT_CLASSES,
  TOUCH_TARGET_OWNER_PATHS,
  TOUCH_TARGET_REGRESSION_MATRIX,
  TOUCH_TARGET_TRADE_SUBMIT_TEST_IDS,
} from '../touch-target-display-contract';

const productRoot = resolve(import.meta.dirname, '../../product');

function readProduct(relativePath: string): string {
  return readFileSync(resolve(productRoot, relativePath.replace(/^product\//, '')), 'utf8');
}

describe('touch-target-display-contract', () => {
  it('keeps contract sync (48px token + 8-chapter regression matrix)', () => {
    expect(() => assertTouchTargetDisplayContractSync()).not.toThrow();
    expect(DS_TOUCH_TARGET_MIN_PX).toBe(48);
    expect(TOUCH_TARGET_REGRESSION_MATRIX).toHaveLength(8);
    expect(TOUCH_TARGET_OWNER_PATHS).toContain('product/primitives/button.tsx');
  });

  it('defines spacing.css --ds-touch-target-min as 48px', () => {
    const css = readProduct('tokens/spacing.css');
    expect(css).toContain(`${DS_TOUCH_TARGET_MIN_TOKEN}: 48px`);
  });

  it('buttonVariants sm/md/lg all consume the touch-target height token', () => {
    for (const size of ['sm', 'md', 'lg'] as const) {
      const classes = buttonVariants({ size });
      expect(classes).toContain(DS_TOUCH_TARGET_HEIGHT_CLASS);
      expect(classes).toContain(DS_TOUCH_TARGET_MIN_HEIGHT_CLASS);
      for (const forbidden of TOUCH_TARGET_FORBIDDEN_HEIGHT_CLASSES) {
        if (forbidden.startsWith('h-') || forbidden.startsWith('min-h-')) {
          expect(classes.split(/\s+/)).not.toContain(forbidden);
        }
      }
    }
  });

  it('IconButton square size consumes the touch-target size token', () => {
    const source = readProduct('primitives/icon-button.tsx');
    expect(source).toContain(DS_TOUCH_TARGET_SIZE_CLASS);
    for (const forbidden of ['size-9', 'size-11', 'size-12'] as const) {
      expect(source).not.toContain(`'${forbidden}'`);
      expect(source).not.toContain(`"${forbidden}"`);
    }
  });

  it('Trade spot/futures primary submit buttons consume min-height token', () => {
    for (const relative of [
      'surfaces/trade/spot-order-ticket.tsx',
      'surfaces/trade/futures-order-ticket.tsx',
      'surfaces/trade/trade-desk-mobile-sticky-cta.tsx',
    ] as const) {
      const source = readProduct(relative);
      expect(source).toContain(DS_TOUCH_TARGET_MIN_HEIGHT_CLASS);
      expect(source).not.toContain('min-h-11');
    }

    expect(TOUCH_TARGET_TRADE_SUBMIT_TEST_IDS).toEqual(['spot-submit', 'futures-submit']);
  });

  it('Input/Select/Tabs/HelpTip owners consume touch-target tokens', () => {
    expect(TOUCH_TARGET_OWNER_PATHS).toContain('product/primitives/input.tsx');
    expect(TOUCH_TARGET_OWNER_PATHS).toContain('product/primitives/help-tip.tsx');

    for (const relative of [
      'primitives/input.tsx',
      'primitives/select.tsx',
      'primitives/tabs.tsx',
    ] as const) {
      const source = readProduct(relative);
      expect(source).toContain(DS_TOUCH_TARGET_MIN_HEIGHT_CLASS);
      for (const forbidden of ['h-11', 'min-h-9'] as const) {
        expect(source.split(/\s+/).join(' ')).not.toContain(` ${forbidden} `);
        expect(source).not.toContain(`'${forbidden}`);
      }
    }

    expect(readProduct('primitives/help-tip.tsx')).not.toContain('size-8');
  });

  it('regression matrix covers five-tab hubs plus auth/shell/admin', () => {
    const chapters = TOUCH_TARGET_REGRESSION_MATRIX.map((row) => row.chapter);
    expect(chapters).toEqual([
      'earn',
      'wallet',
      'trade',
      'sports',
      'casino',
      'auth',
      'shell',
      'admin',
    ]);

    const trade = TOUCH_TARGET_REGRESSION_MATRIX.find((row) => row.chapter === 'trade');
    expect(trade?.sizeImpact).toBe('sm+md+submit');
    expect(trade?.routes).toContain('/trade');
  });
});
