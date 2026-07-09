import { describe, expect, it } from 'vitest';

import {
  readTradeConfirmPref,
  readTradeOneClickPref,
  resolveTradeOrderConfirmRequired,
  SETTINGS_TRADE_CONFIRM_PREF_KEY,
  SETTINGS_TRADE_ONE_CLICK_PREF_KEY,
  writeTradeConfirmPref,
  writeTradeOneClickPref,
} from '../trade-settings-prefs-display-contract';

describe('trade-settings-prefs-display-contract', () => {
  it('defaults to confirm on and one-click off', () => {
    window.localStorage.removeItem(SETTINGS_TRADE_ONE_CLICK_PREF_KEY);
    window.localStorage.removeItem(SETTINGS_TRADE_CONFIRM_PREF_KEY);

    expect(readTradeOneClickPref()).toBe(false);
    expect(readTradeConfirmPref()).toBe(true);
    expect(resolveTradeOrderConfirmRequired()).toBe(true);
  });

  it('persists one-click and confirm prefs', () => {
    writeTradeOneClickPref(true);
    writeTradeConfirmPref(false);

    expect(window.localStorage.getItem(SETTINGS_TRADE_ONE_CLICK_PREF_KEY)).toBe('1');
    expect(window.localStorage.getItem(SETTINGS_TRADE_CONFIRM_PREF_KEY)).toBe('0');
    expect(readTradeOneClickPref()).toBe(true);
    expect(readTradeConfirmPref()).toBe(false);
  });

  it('skips confirm when one-click is on or confirm dialog is off', () => {
    expect(resolveTradeOrderConfirmRequired(true, true)).toBe(false);
    expect(resolveTradeOrderConfirmRequired(false, false)).toBe(false);
    expect(resolveTradeOrderConfirmRequired(false, true)).toBe(true);
  });
});
