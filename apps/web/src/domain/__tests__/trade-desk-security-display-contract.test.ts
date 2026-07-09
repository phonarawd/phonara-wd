import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { translateError } from '@/lib/translate-error';
import { mapTradeRpcErrorKey } from '@/features/trading/trade-rpc-error-display';

import {
  scanTradeDeskErrorSurfaceSource,
  TRADE_DESK_FORBIDDEN_ERROR_SURFACE_PATTERNS,
  TRADE_DESK_P0_ERROR_SURFACES,
  TRADE_DESK_P3B_GRANT_PIN_FUNCTIONS,
  TRADE_DESK_P3B_SECURITY_TODO,
  TRADE_DESK_P3B_SQL_PINS,
  TRADE_DESK_P3B_T0D_SETTLEMENT_HELPERS,
  TRADE_DESK_S0_SQL_PINS,
} from '../trade-desk-security-display-contract';

const WEB_SRC = resolve(import.meta.dirname, '../..');
const REPO_ROOT = resolve(WEB_SRC, '../../..');

function readWebSrc(relativePath: string): string {
  return readFileSync(resolve(WEB_SRC, relativePath), 'utf8');
}

function readRepo(relativePath: string): string {
  return readFileSync(resolve(REPO_ROOT, relativePath), 'utf8');
}

describe('trade-desk-security-display-contract S0', () => {
  it('exports S0 SQL pin inventory', () => {
    expect(TRADE_DESK_S0_SQL_PINS).toContain('supabase/tests/trade_cross_user_reject_test.sql');
    expect(TRADE_DESK_S0_SQL_PINS).toContain('supabase/tests/hardening_test.sql');
    expect(TRADE_DESK_S0_SQL_PINS).toContain('supabase/tests/spot_open_orders_test.sql');
  });

  it('P0 error surfaces exist on disk', () => {
    for (const path of TRADE_DESK_P0_ERROR_SURFACES) {
      expect(() => readWebSrc(path)).not.toThrow();
    }
    for (const path of TRADE_DESK_S0_SQL_PINS) {
      expect(() => readRepo(path)).not.toThrow();
    }
  });

  it('P0 fetch error banner uses fixed i18n key only (no error.message passthrough)', () => {
    const banner = readWebSrc('product/surfaces/trade/trade-desk-fetch-error-banner.tsx');
    expect(banner).toContain('TRADE_DESK_FETCH_ERROR_MESSAGE_KEY');
    expect(banner).toContain('t(TRADE_DESK_FETCH_ERROR_MESSAGE_KEY)');
    expect(banner).not.toMatch(/\berror\.message\b/);
    expect(banner).not.toMatch(/\berr\.message\b/);
  });

  it('P0 market status banner renders titleKey/descriptionKey via t() only', () => {
    const banner = readWebSrc('product/surfaces/trade/trade-market-status-banner.tsx');
    expect(banner).toMatch(/t\(status!?\.titleKey\)/);
    expect(banner).toMatch(/t\(status!?\.descriptionKey\)/);
    const scan = scanTradeDeskErrorSurfaceSource(
      'product/surfaces/trade/trade-market-status-banner.tsx',
      banner,
    );
    expect(scan.violations).toEqual([]);
  });

  it('trade feedback routes RPC errors through mapTradeRpcErrorKey / translateError', () => {
    const feedback = readWebSrc('features/trading/trade-feedback-display.ts');
    expect(feedback).toContain('mapTradeRpcErrorKey');
    expect(feedback).toContain('translate(readLocale(), errorKey)');
    expect(feedback).not.toMatch(/\berror\.message\b/);
  });

  it('use-trading wires client_request_id idempotency refs for submit paths', () => {
    const trading = readWebSrc('hooks/use-trading.ts');
    expect(trading).toContain('openIdRef');
    expect(trading).toContain('buyIdRef');
    expect(trading).toContain('sellIdRef');
    expect(trading).toContain('p_client_request_id');
    expect(trading).toContain('setBusy(true)');
    expect(trading).toContain('translateError(err)');
  });

  it('translateError maps raw PostgREST payloads to error.UNKNOWN (no raw leak)', () => {
    const rawPayload = {
      message: 'relation secret_table does not exist',
      details: 'FATAL: internal stack at uuid-1234-5678',
      hint: 'Check server logs',
      code: '42P01',
    };
    expect(translateError(rawPayload)).toBe('error.UNKNOWN');
    expect(mapTradeRpcErrorKey(rawPayload)).toBe('error.UNKNOWN');
    for (const fragment of Object.values(rawPayload)) {
      expect(translateError({ message: fragment })).not.toBe(fragment as string);
    }
  });

  it('forbidden error surface pattern list stays stable', () => {
    expect(TRADE_DESK_FORBIDDEN_ERROR_SURFACE_PATTERNS.length).toBeGreaterThanOrEqual(5);
  });

  it('cross-user SQL pin asserts forbidden on futures close and spot cancel', () => {
    const sql = readRepo('supabase/tests/trade_cross_user_reject_test.sql');
    expect(sql).toContain('rpc_close_futures_position');
    expect(sql).toContain('rpc_cancel_spot_order');
    expect(sql).toContain('%forbidden%');
    expect(sql).toContain('v_attacker');
    expect(sql).toContain('v_owner');
  });

  it('idempotency SQL pins assert duplicate_request guard', () => {
    const hardening = readRepo('supabase/tests/hardening_test.sql');
    const spotOrders = readRepo('supabase/tests/spot_open_orders_test.sql');
    expect(hardening).toContain('duplicate_request');
    expect(hardening).toContain('client_request_id');
    expect(spotOrders).toContain('duplicate_request');
  });
});

describe('trade-desk-security-display-contract P3-B · Launch RC advisory closeout', () => {
  it('registers P3-B todo and SQL pin inventory (distinct from S0)', () => {
    expect(TRADE_DESK_P3B_SECURITY_TODO).toBe('p3-security-hardening');
    expect(TRADE_DESK_P3B_SQL_PINS).toEqual([
      'supabase/tests/grants_rls_inventory_test.sql',
      'supabase/tests/trade_t0d_candles_display_safety_test.sql',
    ]);
    for (const pin of TRADE_DESK_S0_SQL_PINS) {
      expect(TRADE_DESK_P3B_SQL_PINS).not.toContain(pin);
    }
  });

  it('P3-B SQL pins exist on disk', () => {
    for (const path of TRADE_DESK_P3B_SQL_PINS) {
      expect(() => readRepo(path)).not.toThrow();
    }
  });

  it('grants_rls inventory pins entry RPCs and cron workers (Launch RC §4E advisory)', () => {
    const grants = readRepo('supabase/tests/grants_rls_inventory_test.sql');
    expect(grants).toContain('Trade Desk P3-B');
    for (const fn of TRADE_DESK_P3B_GRANT_PIN_FUNCTIONS) {
      expect(grants).toContain(fn);
    }
    expect(grants).toContain('rpc_run_spot_order_fills');
    expect(grants).toContain('rpc_run_funding_accrual');
    expect(grants).toContain('authenticated must NOT EXECUTE rpc_run_spot_order_fills');
    expect(grants).toContain('service_role must EXECUTE rpc_run_funding_accrual');
  });

  it('T0-d settlement grep allowlist includes T1 _fill_house_spot_order helper', () => {
    const t0d = readRepo('supabase/tests/trade_t0d_candles_display_safety_test.sql');
    for (const helper of TRADE_DESK_P3B_T0D_SETTLEMENT_HELPERS) {
      expect(t0d).toContain(helper);
    }
    expect(t0d).toContain('settlement grep leak');
    expect(t0d).toContain("ILIKE '%rpc_get_candles%'");
  });
});
