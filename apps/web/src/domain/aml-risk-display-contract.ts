/**
 * AML / risk signal exposure — Phase 1 E19 discovery contract.
 * Maps engine tables (risk_flags, str_cases, sanctions_screenings, aml_events,
 * sports_device_signals) to admin `/admin/queues` compliance tabs and user gated states.
 * Reports MISSING admin/user wiring only — no new detection algorithms.
 *
 * Authority: `docs/ENGINE_APEX_CLOSEOUT.md` (frozen) · `docs/SSOT/ENGINE_BOUNDARY.md` §E19 · plan §19 · `20260623000002_aml_free_defense.sql`
 */

export const AML_COMPLIANCE_STATUS_RPC = 'rpc_get_compliance_status' as const;
export const AML_CLEAR_RISK_FLAG_RPC = 'rpc_clear_risk_flag' as const;
export const AML_UPDATE_STR_RPC = 'rpc_update_str_case_status' as const;
export const AML_RESOLVE_SANCTIONS_RPC = 'rpc_resolve_sanctions_screening' as const;

export const AML_RISK_FLAGS_TABLE = 'risk_flags' as const;
export const AML_STR_CASES_TABLE = 'str_cases' as const;
export const AML_SANCTIONS_TABLE = 'sanctions_screenings' as const;
export const AML_EVENTS_TABLE = 'aml_events' as const;
export const AML_IDENTITY_FP_TABLE = 'aml_identity_fingerprints' as const;
export const AML_SPORTS_DEVICE_TABLE = 'sports_device_signals' as const;

export const ADMIN_QUEUES_ROUTE = '/admin/queues' as const;
export const ADMIN_USERS_ROUTE = '/admin/users' as const;

export const USER_WALLET_ROUTE = '/wallet' as const;
export const USER_TRADE_ROUTE = '/trade' as const;
export const USER_SPORTS_ROUTE = '/sports' as const;
export const USER_CASINO_ROUTE = '/casino' as const;

/** Phase 9 net-new rebuild owner — card-priority compliance desk (plan §19.1). */
export const AML_ADMIN_QUEUES_REBUILD_TODO = 'p9-route-admin-queues' as const;

export type AmlRiskEngineBranch =
  | 'duplicate_identity_fingerprint'
  | 'aml_event_log'
  | 'withdraw_velocity_structuring'
  | 'sanctions_screening_lifecycle'
  | 'risk_flags_active'
  | 'str_cases_open'
  | 'sports_multi_account_device'
  | 'rg_self_exclusion_flag'
  | 'ml_risk_score';

export type AmlRiskEngineStatus = 'exists' | 'partial' | 'missing';

export type AmlRiskExposureMode =
  | 'live'
  | 'partial'
  | 'missing'
  | 'built_hidden'
  | 'admin_only'
  | 'defer_stub';

/** Engine-produced risk_flag.flag_type values (migrations + tests — 2026-07-02 audit). */
export const AML_ENGINE_RISK_FLAG_TYPES = [
  'sanctions_hit',
  'sanctions_pending',
  'account_activity_frozen',
  'aml_structuring_review',
  'rg_self_exclusion',
] as const;

export type AmlEngineRiskFlagType = (typeof AML_ENGINE_RISK_FLAG_TYPES)[number];

/** Admin desk RiskFlagType union — includes mock-only types not emitted by engine SQL. */
export const AML_ADMIN_RISK_FLAG_TYPES = [
  'rg_self_exclusion',
  'rg_cooldown',
  'rg_deposit_limit',
  'fraud_pattern',
  'vpn_proxy',
] as const;

export type AmlAdminRiskFlagType = (typeof AML_ADMIN_RISK_FLAG_TYPES)[number];

/** Engine-produced str_cases.case_type values. */
export const AML_ENGINE_STR_CASE_TYPES = ['sanctions_hit', 'aml_structuring'] as const;

export type AmlEngineStrCaseType = (typeof AML_ENGINE_STR_CASE_TYPES)[number];

/** Admin desk StrCaseType filter union — includes presentation types without engine writers. */
export const AML_ADMIN_STR_CASE_TYPES = [
  'structuring',
  'rapid_movement',
  'high_risk_geo',
  'chip_dumping',
] as const;

export type AmlAdminStrCaseType = (typeof AML_ADMIN_STR_CASE_TYPES)[number];

export const AML_RISK_ENGINE_BRANCHES: Readonly<
  Record<
    AmlRiskEngineBranch,
    {
      engine: AmlRiskEngineStatus;
      source: string;
      moneyPath: boolean;
      userExpose: boolean;
    }
  >
> = {
  duplicate_identity_fingerprint: {
    engine: 'exists',
    source: `${AML_IDENTITY_FP_TABLE} · _aml_assert_identity_not_duplicate`,
    moneyPath: false,
    userExpose: false,
  },
  aml_event_log: {
    engine: 'exists',
    source: `${AML_EVENTS_TABLE} · _aml_log_event`,
    moneyPath: false,
    userExpose: false,
  },
  withdraw_velocity_structuring: {
    engine: 'exists',
    source: '_aml_assert_withdrawal_defense · aml_structuring_review flag + aml_structuring STR',
    moneyPath: true,
    userExpose: false,
  },
  sanctions_screening_lifecycle: {
    engine: 'exists',
    source: `${AML_SANCTIONS_TABLE} · ${AML_RESOLVE_SANCTIONS_RPC} · admin_review_queue`,
    moneyPath: true,
    userExpose: false,
  },
  risk_flags_active: {
    engine: 'exists',
    source: `${AML_RISK_FLAGS_TABLE} · ${AML_CLEAR_RISK_FLAG_RPC}`,
    moneyPath: true,
    userExpose: false,
  },
  str_cases_open: {
    engine: 'exists',
    source: `${AML_STR_CASES_TABLE} · ${AML_UPDATE_STR_RPC}`,
    moneyPath: true,
    userExpose: false,
  },
  sports_multi_account_device: {
    engine: 'exists',
    source: `${AML_SPORTS_DEVICE_TABLE} · _assert_sports_device_signals`,
    moneyPath: true,
    userExpose: false,
  },
  rg_self_exclusion_flag: {
    engine: 'exists',
    source: 'responsible_gambling migration · rg_self_exclusion risk_flag',
    moneyPath: false,
    userExpose: false,
  },
  ml_risk_score: {
    engine: 'missing',
    source: 'no risk_score column/RPC — rule-based only',
    moneyPath: false,
    userExpose: false,
  },
};

export type AmlRiskAdminPlacement = {
  route: typeof ADMIN_QUEUES_ROUTE | typeof ADMIN_USERS_ROUTE;
  tabOrRole: 'kyc' | 'str' | 'risk_rg' | 'sanctions' | 'users_list';
  hook: string;
  component: string;
};

export const AML_RISK_ADMIN_PLACEMENT: Readonly<AmlRiskAdminPlacement[]> = [
  {
    route: ADMIN_QUEUES_ROUTE,
    tabOrRole: 'kyc',
    hook: 'useAdminCompliance',
    component: 'ComplianceKycQueue',
  },
  {
    route: ADMIN_QUEUES_ROUTE,
    tabOrRole: 'str',
    hook: 'useAdminCompliance',
    component: 'ComplianceStrQueue',
  },
  {
    route: ADMIN_QUEUES_ROUTE,
    tabOrRole: 'risk_rg',
    hook: 'useAdminCompliance',
    component: 'ComplianceRiskRgQueue',
  },
  {
    route: ADMIN_USERS_ROUTE,
    tabOrRole: 'users_list',
    hook: 'useAdminUsersDesk · rpc_admin_list_users',
    component: 'UsersDeskHub',
  },
];

/** Phase 1 admin UI wire status (2026-07-02). */
export const AML_RISK_ADMIN_UI_WIRE_STATUS: Readonly<
  Record<
    | 'queues_kyc_tab'
    | 'queues_str_tab'
    | 'queues_risk_tab'
    | 'queues_sanctions_tab'
    | 'queues_card_priority_sort'
    | 'queues_sla_overdue_highlight'
    | 'queues_high_risk_flag_sort'
    | 'users_risk_flag_count_column'
    | 'users_aml_events_drawer'
    | 'users_sports_device_signals'
    | 'admin_aml_events_feed'
    | 'admin_duplicate_identity_queue',
    AmlRiskExposureMode
  >
> = {
  queues_kyc_tab: 'live',
  queues_str_tab: 'partial',
  queues_risk_tab: 'partial',
  queues_sanctions_tab: 'missing',
  queues_card_priority_sort: 'missing',
  queues_sla_overdue_highlight: 'partial',
  queues_high_risk_flag_sort: 'missing',
  users_risk_flag_count_column: 'missing',
  users_aml_events_drawer: 'missing',
  users_sports_device_signals: 'admin_only',
  admin_aml_events_feed: 'missing',
  admin_duplicate_identity_queue: 'missing',
};

/** Phase 1 user UI wire status — money routes gated state inventory (plan §19.1 · §16.1). */
export const AML_RISK_USER_UI_WIRE_STATUS: Readonly<
  Record<
    | 'global_activity_frozen_banner'
    | 'wallet_compliance_guide'
    | 'trade_risk_gated_state'
    | 'sports_risk_gated_state'
    | 'casino_risk_gated_state'
    | 'active_risk_flag_reason_copy'
    | 'sports_multi_account_user_leak',
    AmlRiskExposureMode
  >
> = {
  global_activity_frozen_banner: 'partial',
  wallet_compliance_guide: 'live',
  trade_risk_gated_state: 'missing',
  sports_risk_gated_state: 'missing',
  casino_risk_gated_state: 'missing',
  active_risk_flag_reason_copy: 'missing',
  sports_multi_account_user_leak: 'built_hidden',
};

/**
 * Phase 1 MISSING-only backlog — admin queue completeness gaps for Phase 9 rebuild.
 * Intentionally excludes engine EXISTS branches and sports_device_signals user leak (forbidden).
 */
export const AML_RISK_ADMIN_EXPOSURE_MISSING: readonly string[] = [
  'sanctions_screenings pending queue tab — rpc_resolve_sanctions_screening wired in queues.ts but no ComplianceSanctionsQueue UI',
  'admin_review_queue sanctions_screening rows not fetched by useAdminCompliance (KYC entity_type only)',
  'engine risk_flag types sanctions_hit · sanctions_pending · account_activity_frozen · aml_structuring_review mis-mapped to fraud_pattern in mapRiskRow',
  'engine str_cases sanctions_hit · aml_structuring mis-mapped to structuring in mapStrRow — filter chips omit engine case types',
  'admin StrCaseType rapid_movement/chip_dumping/high_risk_geo filter types have zero SQL writers — mock drift vs engine',
  'card-priority sort · SLA overdue · high-risk flag top sort — table layout only (plan §19.1 Phase 9)',
  'rpc_admin_list_users risk_flag_count not rendered in UsersDeskHub columns',
  'aml_events admin feed — table exists · RLS admin rw · no desk surface',
  'aml_identity_fingerprints duplicate-identity review — engine block only · no operator queue',
  'RG cooldown/limit override actions disabled (admin.wire.disabledNoRpc) — only clearRiskFlag live',
];

/** User-side MISSING — gated money routes beyond wallet compliance guide. */
export const AML_RISK_USER_EXPOSURE_MISSING: readonly string[] = [
  'useComplianceStatus + WalletComplianceGuide wired on /wallet only — not Trade/Sports/Casino controllers',
  'AccountRestrictionBanner reads profiles.activity_frozen only — ignores rpc_get_compliance_status blocks and active risk_flags',
  'no per-flag user copy for aml_structuring_review / sanctions_hit — generic account.restricted.* only',
];

/** Engine backlog — explicitly not UI scope (plan §19 · §0). */
export const AML_RISK_ENGINE_BACKLOG: readonly string[] = [
  'ml_risk_score realtime scoring',
  'dedicated fraud dashboard parallel route',
  'sports_device_signals user-facing detection copy',
];

export function isEngineRiskFlagType(value: string): value is AmlEngineRiskFlagType {
  return (AML_ENGINE_RISK_FLAG_TYPES as readonly string[]).includes(value);
}

export function isAdminRiskFlagType(value: string): value is AmlAdminRiskFlagType {
  return (AML_ADMIN_RISK_FLAG_TYPES as readonly string[]).includes(value);
}

export function isEngineStrCaseType(value: string): value is AmlEngineStrCaseType {
  return (AML_ENGINE_STR_CASE_TYPES as readonly string[]).includes(value);
}

/** Unknown engine flag types must not collapse to fraud_pattern in Phase 9 — preserve raw flag_type. */
export function shouldPreserveRawEngineFlagType(flagType: string): boolean {
  return isEngineRiskFlagType(flagType) && !isAdminRiskFlagType(flagType);
}

/** Sanctions resolution RPC exists but admin tab is absent until Phase 9. */
export function isSanctionsQueueUiMissing(): boolean {
  return AML_RISK_ADMIN_UI_WIRE_STATUS.queues_sanctions_tab === 'missing';
}

/** Multi-account defense stays server-side — user UI must remain hidden. */
export function shouldHideSportsMultiAccountFromUser(): boolean {
  return AML_RISK_USER_UI_WIRE_STATUS.sports_multi_account_user_leak === 'built_hidden';
}

export function shouldDeferMlRiskScore(): boolean {
  return AML_RISK_ENGINE_BRANCHES.ml_risk_score.engine === 'missing';
}

export function listAmlRiskAdminMissing(): readonly string[] {
  return AML_RISK_ADMIN_EXPOSURE_MISSING;
}

export function listAmlRiskUserMissing(): readonly string[] {
  return AML_RISK_USER_EXPOSURE_MISSING;
}
