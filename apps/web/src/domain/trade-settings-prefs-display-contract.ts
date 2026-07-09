/**
 * Trade order ticket prefs — one-click · confirm dialog (localStorage · read-only on desk).
 * Settings hub writes · spot/futures ticket submit reads only (no duplicate confirm layer).
 *
 * Authority: TRADE_UX_CANON.md · settings-hub-display-contract (casino confirm pattern)
 * Plan: p9-trade-settings-prefs-wire (P9 WORLD step 24)
 */

export const P9_TRADE_SETTINGS_PREFS_WIRE_TODO = 'p9-trade-settings-prefs-wire' as const;

/** Canonical settings hub route — trade confirm / one-click toggles (P2-6 discoverability). */
export const TRADE_SETTINGS_HUB_ROUTE = '/settings' as const;

export const SETTINGS_TRADE_ONE_CLICK_PREF_KEY = 'phonara.settings.trade.oneClick' as const;
export const SETTINGS_TRADE_CONFIRM_PREF_KEY = 'phonara.settings.trade.confirmDialog' as const;

export const TRADE_SETTINGS_PREFS_WIRE_OWNERS = [
  'trade-settings-prefs-display-contract.ts',
  'use-settings-hub-controller.ts',
  'settings-hub-page.tsx',
  'use-spot-desk-wire.ts',
  'use-futures-desk-wire.ts',
] as const;

function readBooleanPref(key: string, defaultValue: boolean): boolean {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const value = window.localStorage.getItem(key);
    if (value === '1' || value === 'true') return true;
    if (value === '0' || value === 'false') return false;
  } catch {
    // privacy mode / SSR
  }
  return defaultValue;
}

function writeBooleanPref(key: string, enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, enabled ? '1' : '0');
  } catch {
    // ignore
  }
}

/** One-click trading — skip confirm dialog on ticket submit. Default OFF (safer). */
export function readTradeOneClickPref(): boolean {
  return readBooleanPref(SETTINGS_TRADE_ONE_CLICK_PREF_KEY, false);
}

export function writeTradeOneClickPref(enabled: boolean): void {
  writeBooleanPref(SETTINGS_TRADE_ONE_CLICK_PREF_KEY, enabled);
}

/** Order confirmation dialog before ticket submit. Default ON (safer). */
export function readTradeConfirmPref(): boolean {
  return readBooleanPref(SETTINGS_TRADE_CONFIRM_PREF_KEY, true);
}

export function writeTradeConfirmPref(enabled: boolean): void {
  writeBooleanPref(SETTINGS_TRADE_CONFIRM_PREF_KEY, enabled);
}

/**
 * Ticket submit gate — existing ConfirmDialog only when true.
 * One-click OR confirm-off → direct submit (single path, no second modal).
 */
export function resolveTradeOrderConfirmRequired(
  oneClick: boolean = readTradeOneClickPref(),
  confirmDialog: boolean = readTradeConfirmPref(),
): boolean {
  if (oneClick) return false;
  return confirmDialog;
}
