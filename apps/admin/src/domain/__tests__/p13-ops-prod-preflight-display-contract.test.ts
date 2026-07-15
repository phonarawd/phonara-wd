import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  assertP13OpsProdPreflightSync,
  P13_OPS_PROD_PREFLIGHT_ARTIFACT_PATHS,
  P13_OPS_PROD_PREFLIGHT_CANON_PATH,
  P13_OPS_PROD_PREFLIGHT_ENGINE_MIGRATION_TOUCH,
  P13_OPS_PROD_PREFLIGHT_NEXT_TODO,
  P13_OPS_PROD_PREFLIGHT_PREREQUISITE_TODO,
  P13_OPS_PROD_PREFLIGHT_SPOTCHECK_PATH,
  P13_OPS_PROD_PREFLIGHT_TEST_PATHS,
  P13_OPS_PROD_PREFLIGHT_TODO,
  P13_T0A_ALL_CRON_JOBS,
  P13_T0A_CHECKLIST_SECTIONS,
  P13_T0A_CLOSED_BETA_TARGETS,
  P13_T0A_CORE_CRON_JOBS,
  P13_T0A_FEATURE_GATE_INITIAL,
  P13_T0A_FUTURES_MAJOR_MAX_LEVERAGE_DEFAULT,
  P13_T0A_FUTURES_MAJOR_MAX_OI_DEFAULT,
  P13_T0A_INSURANCE_ACCOUNT_CODES,
  P13_T0A_INSURANCE_CONTRIBUTE_RPC,
  P13_T0A_MAX_OPEN_POSITIONS_DEFAULT,
  P13_T0A_MAX_OPEN_POSITIONS_KEY,
  P13_T0A_MFA_AAL2_SQL_HELPER,
  P13_T0A_MFA_ADMIN_ROUTES,
  P13_T0A_PHON_PERP_MAX_LEVERAGE_DEFAULT,
  P13_T0A_PHON_PERP_MAX_OI_DEFAULT,
  P13_T0A_PRICE_EDGE_CRON_JOBS,
  P13_T0A_PRICE_FEED_EDGE_FUNCTION,
  P13_T0A_PRICE_FEED_VAULT_SECRETS,
  P13_T0A_TIER_B_UI_HIDDEN_POLICY_IDS,
  P13_T0A_TRADE_CRON_JOBS,
  P13_T0A_TREASURY_CURRENCIES,
  P13_T0A_TREASURY_UPDATE_RPC,
} from '../p13-ops-prod-preflight-display-contract';

const ADMIN_SRC = resolve(import.meta.dirname, '../..');
const REPO_ROOT = resolve(ADMIN_SRC, '../../..');

describe('p13-ops-prod-preflight-display-contract · YAML #232 T0-A', () => {
  it('registers OPS todo · prerequisite ops-push · next soft-launch · engine touch 0', () => {
    expect(P13_OPS_PROD_PREFLIGHT_TODO).toBe('p13-ops-prod-preflight');
    expect(P13_OPS_PROD_PREFLIGHT_PREREQUISITE_TODO).toBe('p13-admin-ops-push');
    expect(P13_OPS_PROD_PREFLIGHT_NEXT_TODO).toBe('p13-soft-launch-bundle');
    expect(P13_OPS_PROD_PREFLIGHT_ENGINE_MIGRATION_TOUCH).toBe(false);
    expect(() => assertP13OpsProdPreflightSync()).not.toThrow();
  });

  it('pins 7 checklist sections', () => {
    expect(P13_T0A_CHECKLIST_SECTIONS).toEqual([
      'pg_cron_live',
      'price_feed_vault',
      'insurance_treasury_seed',
      'oi_leverage_defaults',
      'mfa_aal2',
      'feature_gate_initial',
      'code_diff_zero',
    ]);
  });

  it('pins 14 cron jobs · price-feed Vault · insurance/treasury codes', () => {
    expect(P13_T0A_CORE_CRON_JOBS).toHaveLength(5);
    expect(P13_T0A_PRICE_EDGE_CRON_JOBS).toContain('phonara_price_feed');
    expect(P13_T0A_TRADE_CRON_JOBS).toContain('trade-funding-accrual');
    expect(P13_T0A_ALL_CRON_JOBS).toHaveLength(14);
    expect(P13_T0A_PRICE_FEED_VAULT_SECRETS).toEqual(['price_feed_url', 'price_feed_invoke_key']);
    expect(P13_T0A_PRICE_FEED_EDGE_FUNCTION).toBe('price-feed');
    expect(P13_T0A_INSURANCE_ACCOUNT_CODES).toEqual(['insurance_fund_phon', 'insurance_fund_usdt']);
    expect(P13_T0A_TREASURY_CURRENCIES).toEqual(['PHON', 'USDT', 'KRW']);
    expect(P13_T0A_INSURANCE_CONTRIBUTE_RPC).toBe('rpc_contribute_insurance_capital');
    expect(P13_T0A_TREASURY_UPDATE_RPC).toBe('rpc_update_treasury_reserve');
  });

  it('pins OI/leverage defaults · T0-A feature gates OFF for cross/funding', () => {
    expect(P13_T0A_MAX_OPEN_POSITIONS_KEY).toBe('max_open_positions_per_user');
    expect(P13_T0A_MAX_OPEN_POSITIONS_DEFAULT).toBe('50');
    expect(P13_T0A_FUTURES_MAJOR_MAX_LEVERAGE_DEFAULT).toBe('20');
    expect(P13_T0A_FUTURES_MAJOR_MAX_OI_DEFAULT).toBe('500000.000000');
    expect(P13_T0A_PHON_PERP_MAX_LEVERAGE_DEFAULT).toBe('10');
    expect(P13_T0A_PHON_PERP_MAX_OI_DEFAULT).toBe('100000.000000');
    expect(P13_T0A_FEATURE_GATE_INITIAL.feature_cross_margin_enabled).toBe('false');
    expect(P13_T0A_FEATURE_GATE_INITIAL.feature_funding_enabled).toBe('false');
    expect(P13_T0A_TIER_B_UI_HIDDEN_POLICY_IDS).toContain('g7-tier-b-hedge-hidden');
    expect(P13_T0A_CLOSED_BETA_TARGETS.maxLeverage).toBe('5');
    expect(P13_T0A_CLOSED_BETA_TARGETS.insuranceOiPct).toBe(20);
  });

  it('pins MFA AAL2 helper and admin enroll/challenge routes', () => {
    expect(P13_T0A_MFA_AAL2_SQL_HELPER).toBe('_assert_admin_aal2');
    expect(P13_T0A_MFA_ADMIN_ROUTES).toEqual(['/mfa/enroll', '/mfa/challenge']);
  });

  it('requires canon · spotcheck · contract artifacts on disk', () => {
    for (const rel of P13_OPS_PROD_PREFLIGHT_ARTIFACT_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }
    for (const rel of P13_OPS_PROD_PREFLIGHT_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }
  });

  it('canon pins all 7 sections · engine diff 0 · todo ids', () => {
    const canon = readFileSync(resolve(REPO_ROOT, P13_OPS_PROD_PREFLIGHT_CANON_PATH), 'utf8');
    expect(canon).toContain('p13-ops-prod-preflight');
    expect(canon).toContain('p13-admin-ops-push');
    expect(canon).toContain('p13-soft-launch-bundle');
    expect(canon).toContain('pg_cron');
    expect(canon).toContain('price_feed_url');
    expect(canon).toContain('insurance_fund');
    expect(canon).toContain('treasury_reserves');
    expect(canon).toContain('max_open_interest');
    expect(canon).toContain('max_leverage');
    expect(canon).toContain('AAL2');
    expect(canon).toContain('feature_cross_margin_enabled');
    expect(canon).toContain('feature_funding_enabled');
    expect(canon).toContain('코드 diff 0');
    expect(canon).toContain('phonara_price_feed');

    const spotcheck = readFileSync(
      resolve(REPO_ROOT, P13_OPS_PROD_PREFLIGHT_SPOTCHECK_PATH),
      'utf8',
    );
    expect(spotcheck).toContain('phonara_auto_liquidations');
    expect(spotcheck).toContain('price_feed_url');
    expect(spotcheck).toContain('feature_cross_margin_enabled');
    expect(spotcheck).toContain('ROLLBACK');
  });
});
