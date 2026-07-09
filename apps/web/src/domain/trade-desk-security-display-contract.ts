/**
 * Trade Desk S0 security display contract — P0 error surface · UI idempotency gate.
 * SQL cross-user / duplicate idempotency pins live in `supabase/tests/`.
 */

export const TRADE_DESK_SECURITY_S0_TODO = 's0-security-gate' as const;

/** P0 surfaces audited for raw RPC / stack / cross-user data leakage. */
export const TRADE_DESK_P0_ERROR_SURFACES = [
  'product/surfaces/trade/trade-desk-fetch-error-banner.tsx',
  'product/surfaces/trade/trade-market-status-banner.tsx',
  'features/trading/trade-feedback-display.ts',
  'hooks/use-trading.ts',
] as const;

/** SQL integration pins for S0 scope B/C (CI sql job authoritative). */
export const TRADE_DESK_S0_SQL_PINS = [
  'supabase/tests/trade_cross_user_reject_test.sql',
  'supabase/tests/hardening_test.sql',
  'supabase/tests/spot_open_orders_test.sql',
] as const;

/** P3-B residual — Launch RC §4E advisory closeout (no duplicate of S0 body). */
export const TRADE_DESK_P3B_SECURITY_TODO = 'p3-security-hardening' as const;

/** SQL drift pins for grants inventory + T0-d settlement grep (P3-B only). */
export const TRADE_DESK_P3B_SQL_PINS = [
  'supabase/tests/grants_rls_inventory_test.sql',
  'supabase/tests/trade_t0d_candles_display_safety_test.sql',
] as const;

/** Entry RPC + cron worker names pinned in grants_rls_inventory_test (P3-B). */
export const TRADE_DESK_P3B_GRANT_PIN_FUNCTIONS = [
  'rpc_open_futures_position',
  'rpc_close_futures_position',
  'rpc_spot_market_buy',
  'rpc_spot_market_sell',
  'rpc_run_spot_order_fills',
  'rpc_run_funding_accrual',
  '_fill_house_spot_order',
] as const;

/** T1 settlement helper added to T0-d grep allowlist (P3-B). */
export const TRADE_DESK_P3B_T0D_SETTLEMENT_HELPERS = ['_fill_house_spot_order'] as const;

/** Forbidden substrings in P0 user-facing trade error surfaces (Zone B i18n only). */
export const TRADE_DESK_FORBIDDEN_ERROR_SURFACE_PATTERNS = [
  'error.message',
  'err.message',
  'SQLERRM',
  'stack trace',
  'PostgrestError',
  'details:',
  'hint:',
] as const;

export type TradeDeskSecurityScanResult = {
  file: string;
  violations: string[];
};

export function scanTradeDeskErrorSurfaceSource(
  relativePath: string,
  source: string,
): TradeDeskSecurityScanResult {
  const violations: string[] = [];
  for (const pattern of TRADE_DESK_FORBIDDEN_ERROR_SURFACE_PATTERNS) {
    if (source.includes(pattern)) {
      violations.push(pattern);
    }
  }
  return { file: relativePath, violations };
}
