/**
 * P13 OPS — T0-A prod preflight checklist (§20.14 · YAML #232).
 * Authority: `p13-ops-prod-preflight` · docs/OPERATIONS/P13_T0A_PROD_PREFLIGHT.md
 *
 * OPS/DOC only — engine migration · packages/*-engine diff **0**.
 * Live verify = read-only SQL spotcheck + stack:verify-worldno1-edge.
 */

export const P13_OPS_PROD_PREFLIGHT_TODO = 'p13-ops-prod-preflight' as const;

/** Prerequisite Track A INFRA — must be closed before this OPS. */
export const P13_OPS_PROD_PREFLIGHT_PREREQUISITE_TODO = 'p13-admin-ops-push' as const;

/** Next Track A bundle after T0-A checklist green. */
export const P13_OPS_PROD_PREFLIGHT_NEXT_TODO = 'p13-soft-launch-bundle' as const;

/** Engine freeze — this todo must not touch migrations or *-engine packages. */
export const P13_OPS_PROD_PREFLIGHT_ENGINE_MIGRATION_TOUCH = false as const;

/** Checklist section ids — 1:1 with P13_T0A_PROD_PREFLIGHT.md §2. */
export const P13_T0A_CHECKLIST_SECTIONS = [
  'pg_cron_live',
  'price_feed_vault',
  'insurance_treasury_seed',
  'oi_leverage_defaults',
  'mfa_aal2',
  'feature_gate_initial',
  'code_diff_zero',
] as const;

export type P13T0AChecklistSection = (typeof P13_T0A_CHECKLIST_SECTIONS)[number];

/** Core Launch-Ops cron jobs that must be active on prod. */
export const P13_T0A_CORE_CRON_JOBS = [
  'phonara_auto_liquidations',
  'phonara_ops_notify',
  'phonara_ops_notify_digest',
  'phonara_casino_stale_pending_sweep',
  'phonara_daily_reconciliation',
] as const;

/** Price / edge cron jobs (T0-A “pg_cron live · price-feed”). */
export const P13_T0A_PRICE_EDGE_CRON_JOBS = [
  'phonara_price_feed',
  'phonara_phon_internal_oracle',
  'phonara_crypto_chain_watcher',
  'phonara_usdt_krw_feed',
  'phonara_notification_dispatch',
] as const;

/** Trade desk cron jobs (registered + active). */
export const P13_T0A_TRADE_CRON_JOBS = [
  'trade-open-order-fills',
  'trade-spot-order-fills',
  'trade-stop-orders',
  'trade-funding-accrual',
] as const;

export const P13_T0A_ALL_CRON_JOBS = [
  ...P13_T0A_CORE_CRON_JOBS,
  ...P13_T0A_PRICE_EDGE_CRON_JOBS,
  ...P13_T0A_TRADE_CRON_JOBS,
] as const;

/** Vault secrets required for phonara_price_feed → price-feed edge. */
export const P13_T0A_PRICE_FEED_VAULT_SECRETS = [
  'price_feed_url',
  'price_feed_invoke_key',
] as const;

/** Edge function invoked by price-feed cron. */
export const P13_T0A_PRICE_FEED_EDGE_FUNCTION = 'price-feed' as const;

/** Insurance system account codes that must exist (seed row). */
export const P13_T0A_INSURANCE_ACCOUNT_CODES = [
  'insurance_fund_phon',
  'insurance_fund_usdt',
] as const;

/** Operator capital staging accounts (rpc_contribute_insurance_capital). */
export const P13_T0A_INSURANCE_CAPITAL_ACCOUNT_CODES = [
  'operator_contributed_capital_phon',
  'operator_contributed_capital_usdt',
] as const;

/** Treasury reserve currencies (row must exist). */
export const P13_T0A_TREASURY_CURRENCIES = ['PHON', 'USDT', 'KRW'] as const;

/** RPC used to fund insurance (operator · AAL2). */
export const P13_T0A_INSURANCE_CONTRIBUTE_RPC = 'rpc_contribute_insurance_capital' as const;

/** RPC used to set treasury real_balance (admin · AAL2). */
export const P13_T0A_TREASURY_UPDATE_RPC = 'rpc_update_treasury_reserve' as const;

/** Global position cap key. */
export const P13_T0A_MAX_OPEN_POSITIONS_KEY = 'max_open_positions_per_user' as const;

export const P13_T0A_MAX_OPEN_POSITIONS_DEFAULT = '50' as const;

/**
 * T0-A / T1-initial feature gates (Plan §20.14.7).
 * cross margin · funding settlement OFF until ramp todos.
 */
export const P13_T0A_FEATURE_GATE_INITIAL = {
  feature_cross_margin_enabled: 'false',
  feature_funding_enabled: 'false',
  system_halt: 'false',
  system_readonly: 'false',
} as const;

/** Platform rails typically ON for soft-launch readiness (withdrawal operator-gated). */
export const P13_T0A_PLATFORM_FEATURE_KEYS = [
  'feature_deposit_enabled',
  'feature_spot_enabled',
  'feature_futures_enabled',
  'feature_game_enabled',
  'feature_sports_enabled',
  'feature_withdrawal_enabled',
] as const;

/**
 * Tier-B trade UI — no app_config key; presentation `built_hidden` until E21.
 * Contract pins the policy ids only.
 */
export const P13_T0A_TIER_B_UI_HIDDEN_POLICY_IDS = [
  'g7-tier-b-hedge-hidden',
  'g7-tier-b-reduce-only-hidden',
] as const;

/** MFA AAL2 SQL helper — high-risk admin RPCs. */
export const P13_T0A_MFA_AAL2_SQL_HELPER = '_assert_admin_aal2' as const;

/** Admin MFA surfaces (P3 DONE). */
export const P13_T0A_MFA_ADMIN_ROUTES = ['/mfa/enroll', '/mfa/challenge'] as const;

/** Majors futures seed defaults (Tier-1 · max_leverage / OI). */
export const P13_T0A_FUTURES_MAJOR_MAX_LEVERAGE_DEFAULT = '20' as const;

export const P13_T0A_FUTURES_MAJOR_MAX_OI_DEFAULT = '500000.000000' as const;

/** PHON perp seed (tighter than majors). */
export const P13_T0A_PHON_PERP_MAX_LEVERAGE_DEFAULT = '10' as const;

export const P13_T0A_PHON_PERP_MAX_OI_DEFAULT = '100000.000000' as const;

/** Closed Beta numeric targets (consumed by soft-launch · not enforced here). */
export const P13_T0A_CLOSED_BETA_TARGETS = {
  maxLeverage: '5',
  oiUtilizationPct: 50,
  insuranceOiPct: 20,
  krwCap: 500_000,
  usdtCap: 100,
} as const;

export const P13_OPS_PROD_PREFLIGHT_CANON_PATH =
  'docs/OPERATIONS/P13_T0A_PROD_PREFLIGHT.md' as const;

export const P13_OPS_PROD_PREFLIGHT_SPOTCHECK_PATH =
  'scripts/p13-ops-prod-preflight-spotcheck.sql' as const;

export const P13_OPS_PROD_PREFLIGHT_ARTIFACT_PATHS = [
  P13_OPS_PROD_PREFLIGHT_CANON_PATH,
  P13_OPS_PROD_PREFLIGHT_SPOTCHECK_PATH,
  'apps/admin/src/domain/p13-ops-prod-preflight-display-contract.ts',
  'apps/admin/src/domain/__tests__/p13-ops-prod-preflight-display-contract.test.ts',
] as const;

export const P13_OPS_PROD_PREFLIGHT_TEST_PATHS = [
  'apps/admin/src/domain/__tests__/p13-ops-prod-preflight-display-contract.test.ts',
] as const;

export function assertP13OpsProdPreflightSync(): void {
  if (P13_OPS_PROD_PREFLIGHT_TODO !== 'p13-ops-prod-preflight') {
    throw new Error('T0-A todo id drift');
  }
  if (P13_OPS_PROD_PREFLIGHT_PREREQUISITE_TODO !== 'p13-admin-ops-push') {
    throw new Error('T0-A prerequisite must be p13-admin-ops-push');
  }
  if (P13_OPS_PROD_PREFLIGHT_NEXT_TODO !== 'p13-soft-launch-bundle') {
    throw new Error('T0-A next must be p13-soft-launch-bundle');
  }
  if (P13_OPS_PROD_PREFLIGHT_ENGINE_MIGRATION_TOUCH !== false) {
    throw new Error('T0-A must keep engine migration touch false');
  }
  if (P13_T0A_CHECKLIST_SECTIONS.length !== 7) {
    throw new Error('T0-A checklist must have 7 sections');
  }
  if (P13_T0A_ALL_CRON_JOBS.length !== 14) {
    throw new Error('T0-A cron allowlist must be 14 jobs');
  }
  if (P13_T0A_PRICE_FEED_VAULT_SECRETS.length !== 2) {
    throw new Error('price-feed Vault must pin url + invoke_key');
  }
  if (P13_T0A_FEATURE_GATE_INITIAL.feature_cross_margin_enabled !== 'false') {
    throw new Error('T0-A cross margin must stay false');
  }
  if (P13_T0A_FEATURE_GATE_INITIAL.feature_funding_enabled !== 'false') {
    throw new Error('T0-A funding settlement gate must stay false');
  }
}
