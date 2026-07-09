import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  assertTradeDeskA11ySync,
  TRADE_DESK_A11Y_COLORS_CSS,
  TRADE_DESK_A11Y_E2E_KEYBOARD_TEST_TITLE,
  TRADE_DESK_A11Y_E2E_SPEC,
  TRADE_DESK_A11Y_GATE_TEST_PATHS,
  TRADE_DESK_A11Y_TODO,
  TRADE_DESK_AXE_MOBILE_WIDTH,
  TRADE_DESK_AXE_ROUTES,
  TRADE_DESK_AXE_SURFACES,
  TRADE_DESK_CONFIRM_DIALOG_TEST_ID,
  TRADE_DESK_CONTRAST_SPOT_CHECK,
  TRADE_DESK_FUTURES_TAB_ORDER_TEST_IDS,
  TRADE_DESK_KEYBOARD_SUBMIT_INPUTS,
  TRADE_DESK_SPOT_TAB_ORDER_TEST_IDS,
} from '../trade-desk-a11y-display-contract';
import { contrastRatio, parseCssVarOklchMap } from '../trade-desk-a11y-contrast-spot-check';

const REPO_ROOT = resolve(import.meta.dirname, '../../../../..');

function readRepo(relativePath: string): string {
  return readFileSync(resolve(REPO_ROOT, relativePath), 'utf8');
}

describe('trade-desk-a11y-display-contract · P3-E', () => {
  it('registers todo id, routes, surfaces, and gate paths', () => {
    expect(TRADE_DESK_A11Y_TODO).toBe('p3-a11y-expand');
    expect(TRADE_DESK_AXE_ROUTES).toEqual([
      '/trade',
      '/trade/futures',
      '/staking',
      '/staking/positions',
    ]);
    expect(TRADE_DESK_AXE_SURFACES).toHaveLength(6);
    expect(TRADE_DESK_AXE_MOBILE_WIDTH).toBe(390);
    expect(TRADE_DESK_CONFIRM_DIALOG_TEST_ID).toBe('trade-confirm-dialog');
    expect(TRADE_DESK_KEYBOARD_SUBMIT_INPUTS.map((row) => row.testId)).toEqual([
      'spot-amount-input',
      'futures-margin-input',
    ]);
    assertTradeDeskA11ySync();
  });

  it('wires tab-order anchors and keyboard submit test ids into order tickets', () => {
    const spotTicket = readRepo('apps/web/src/product/surfaces/trade/spot-order-ticket.tsx');
    const futuresTicket = readRepo('apps/web/src/product/surfaces/trade/futures-order-ticket.tsx');

    for (const testId of TRADE_DESK_SPOT_TAB_ORDER_TEST_IDS) {
      expect(spotTicket).toContain(`data-testid="${testId}"`);
    }
    for (const testId of TRADE_DESK_FUTURES_TAB_ORDER_TEST_IDS) {
      expect(futuresTicket).toContain(`data-testid="${testId}"`);
    }
    for (const row of TRADE_DESK_KEYBOARD_SUBMIT_INPUTS) {
      const source = row.surface === 'spot' ? spotTicket : futuresTicket;
      expect(source).toContain(`data-testid="${row.testId}"`);
      expect(source).toContain('handleOrderTicketEnterSubmit');
    }
  });

  it('wires confirm dialog focus-trap test id and E2E keyboard-only path', () => {
    const confirmDialog = readRepo('apps/web/src/product/primitives/confirm-dialog.tsx');
    const spotTicket = readRepo('apps/web/src/product/surfaces/trade/spot-order-ticket.tsx');
    const e2e = readRepo(TRADE_DESK_A11Y_E2E_SPEC);

    expect(confirmDialog).toContain('contentTestId');
    expect(spotTicket).toContain('TRADE_DESK_CONFIRM_DIALOG_TEST_ID');
    expect(e2e).toContain(TRADE_DESK_A11Y_E2E_KEYBOARD_TEST_TITLE);
    expect(e2e).toContain('spot-amount-input');
  });

  it('passes advisory WCAG contrast spot-check on --ds-* light and dark branches', () => {
    const css = readRepo(TRADE_DESK_A11Y_COLORS_CSS);
    const tokens = parseCssVarOklchMap(css);

    for (const row of TRADE_DESK_CONTRAST_SPOT_CHECK) {
      const fg = tokens.get(row.foregroundVar);
      const bg = tokens.get(row.backgroundVar);
      expect(fg, `missing ${row.foregroundVar}`).toBeDefined();
      expect(bg, `missing ${row.backgroundVar}`).toBeDefined();
      expect(contrastRatio(fg!.light, bg!.light)).toBeGreaterThanOrEqual(row.minRatio);
      expect(contrastRatio(fg!.dark, bg!.dark)).toBeGreaterThanOrEqual(row.minRatio);
    }
  });

  it('lists gate test paths that exist in repo', () => {
    for (const path of TRADE_DESK_A11Y_GATE_TEST_PATHS) {
      expect(() => readRepo(path)).not.toThrow();
    }
  });
});
