import { describe, expect, it } from 'vitest';
import {
  ADMIN_RBAC_ROLES,
  canPerformAdminAction,
  resolvePrimaryAdminRole,
} from '@/domain/admin-rbac';

describe('admin-rbac permission matrix', () => {
  it('defines six team roles', () => {
    expect(ADMIN_RBAC_ROLES).toEqual(['owner', 'finance', 'risk', 'support', 'operator', 'viewer']);
  });

  it('owner can perform all gated actions', () => {
    expect(canPerformAdminAction('owner', 'queues.withdraw.approve')).toBe(true);
    expect(canPerformAdminAction('owner', 'access.rbac.manage')).toBe(true);
    expect(canPerformAdminAction('owner', 'operations.kill_switch')).toBe(true);
  });

  it('viewer cannot approve withdrawals or toggle kill switches', () => {
    expect(canPerformAdminAction('viewer', 'queues.withdraw.approve')).toBe(false);
    expect(canPerformAdminAction('viewer', 'operations.kill_switch')).toBe(false);
  });

  it('finance can approve withdrawals but not manage RBAC grants', () => {
    expect(canPerformAdminAction('finance', 'queues.withdraw.approve')).toBe(true);
    expect(canPerformAdminAction('finance', 'access.rbac.manage')).toBe(false);
  });

  it('risk can review KYC but not wallet adjustments', () => {
    expect(canPerformAdminAction('risk', 'queues.kyc.review')).toBe(true);
    expect(canPerformAdminAction('risk', 'users.wallet_adjust')).toBe(false);
  });

  it('resolvePrimaryAdminRole picks highest rank', () => {
    expect(resolvePrimaryAdminRole(['viewer', 'finance'])).toBe('finance');
    expect(resolvePrimaryAdminRole(['support', 'operator'])).toBe('operator');
  });
});
