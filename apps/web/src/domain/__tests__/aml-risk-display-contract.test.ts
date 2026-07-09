import { describe, expect, it } from 'vitest';
import {
  AML_ADMIN_RISK_FLAG_TYPES,
  AML_ADMIN_STR_CASE_TYPES,
  AML_ENGINE_RISK_FLAG_TYPES,
  AML_ENGINE_STR_CASE_TYPES,
  AML_RISK_ADMIN_EXPOSURE_MISSING,
  AML_RISK_ADMIN_PLACEMENT,
  AML_RISK_ADMIN_UI_WIRE_STATUS,
  AML_RISK_ENGINE_BRANCHES,
  AML_RISK_USER_EXPOSURE_MISSING,
  AML_RISK_USER_UI_WIRE_STATUS,
  ADMIN_QUEUES_ROUTE,
  isEngineRiskFlagType,
  isSanctionsQueueUiMissing,
  listAmlRiskAdminMissing,
  listAmlRiskUserMissing,
  shouldDeferMlRiskScore,
  shouldHideSportsMultiAccountFromUser,
  shouldPreserveRawEngineFlagType,
} from '../aml-risk-display-contract';

describe('aml-risk-display-contract', () => {
  it('locks E19 admin placement to /admin/queues compliance tabs + /admin/users', () => {
    expect(AML_RISK_ADMIN_PLACEMENT).toHaveLength(4);
    const routes = AML_RISK_ADMIN_PLACEMENT.map((row) => row.route);
    expect(routes.filter((r) => r === ADMIN_QUEUES_ROUTE)).toHaveLength(3);
    expect(AML_RISK_ADMIN_PLACEMENT.some((row) => row.component === 'ComplianceStrQueue')).toBe(
      true,
    );
    expect(AML_RISK_ADMIN_PLACEMENT.some((row) => row.component === 'ComplianceRiskRgQueue')).toBe(
      true,
    );
  });

  it('documents EXISTS engine AML branches (Phase 1 audit)', () => {
    expect(AML_RISK_ENGINE_BRANCHES.duplicate_identity_fingerprint.engine).toBe('exists');
    expect(AML_RISK_ENGINE_BRANCHES.aml_event_log.engine).toBe('exists');
    expect(AML_RISK_ENGINE_BRANCHES.withdraw_velocity_structuring.engine).toBe('exists');
    expect(AML_RISK_ENGINE_BRANCHES.sanctions_screening_lifecycle.engine).toBe('exists');
    expect(AML_RISK_ENGINE_BRANCHES.risk_flags_active.engine).toBe('exists');
    expect(AML_RISK_ENGINE_BRANCHES.str_cases_open.engine).toBe('exists');
    expect(AML_RISK_ENGINE_BRANCHES.sports_multi_account_device.engine).toBe('exists');
    expect(AML_RISK_ENGINE_BRANCHES.rg_self_exclusion_flag.engine).toBe('exists');
  });

  it('marks ML risk score as engine MISSING (not UI scope)', () => {
    expect(AML_RISK_ENGINE_BRANCHES.ml_risk_score.engine).toBe('missing');
    expect(shouldDeferMlRiskScore()).toBe(true);
  });

  it('documents admin queue PARTIAL wire and sanctions tab MISSING', () => {
    expect(AML_RISK_ADMIN_UI_WIRE_STATUS.queues_kyc_tab).toBe('live');
    expect(AML_RISK_ADMIN_UI_WIRE_STATUS.queues_str_tab).toBe('partial');
    expect(AML_RISK_ADMIN_UI_WIRE_STATUS.queues_risk_tab).toBe('partial');
    expect(AML_RISK_ADMIN_UI_WIRE_STATUS.queues_sanctions_tab).toBe('missing');
    expect(isSanctionsQueueUiMissing()).toBe(true);
    expect(AML_RISK_ADMIN_UI_WIRE_STATUS.queues_card_priority_sort).toBe('missing');
    expect(AML_RISK_ADMIN_UI_WIRE_STATUS.users_risk_flag_count_column).toBe('missing');
  });

  it('flags engine vs admin type drift on risk_flags and str_cases', () => {
    expect(AML_ENGINE_RISK_FLAG_TYPES).toContain('sanctions_hit');
    expect(AML_ENGINE_RISK_FLAG_TYPES).toContain('aml_structuring_review');
    expect(AML_ADMIN_RISK_FLAG_TYPES).toContain('fraud_pattern');
    expect(AML_ADMIN_RISK_FLAG_TYPES).not.toContain('sanctions_hit');
    expect(shouldPreserveRawEngineFlagType('sanctions_hit')).toBe(true);
    expect(isEngineRiskFlagType('rg_self_exclusion')).toBe(true);

    expect(AML_ENGINE_STR_CASE_TYPES).toEqual(['sanctions_hit', 'aml_structuring']);
    expect(AML_ADMIN_STR_CASE_TYPES).not.toContain('sanctions_hit');
    expect(AML_ADMIN_STR_CASE_TYPES).not.toContain('aml_structuring');
  });

  it('documents user wallet compliance live and money-route gated states MISSING', () => {
    expect(AML_RISK_USER_UI_WIRE_STATUS.wallet_compliance_guide).toBe('live');
    expect(AML_RISK_USER_UI_WIRE_STATUS.trade_risk_gated_state).toBe('missing');
    expect(AML_RISK_USER_UI_WIRE_STATUS.sports_risk_gated_state).toBe('missing');
    expect(AML_RISK_USER_UI_WIRE_STATUS.casino_risk_gated_state).toBe('missing');
    expect(AML_RISK_USER_UI_WIRE_STATUS.global_activity_frozen_banner).toBe('partial');
  });

  it('forbids sports multi-account signal leak to user UI', () => {
    expect(shouldHideSportsMultiAccountFromUser()).toBe(true);
    expect(AML_RISK_USER_UI_WIRE_STATUS.sports_multi_account_user_leak).toBe('built_hidden');
  });

  it('exports non-empty MISSING-only admin and user backlog lists', () => {
    expect(listAmlRiskAdminMissing().length).toBeGreaterThan(0);
    expect(listAmlRiskUserMissing().length).toBeGreaterThan(0);
    expect(AML_RISK_ADMIN_EXPOSURE_MISSING.some((line) => line.includes('sanctions'))).toBe(true);
    expect(AML_RISK_USER_EXPOSURE_MISSING.some((line) => line.includes('/wallet only'))).toBe(true);
  });
});
