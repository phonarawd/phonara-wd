import { describe, expect, it } from 'vitest';

import {
  SYSTEM_STATUS_FAIL_CLOSED_BADGE_STATE,
  SYSTEM_STATUS_PUBLIC_RPC,
  SYSTEM_STATUS_ROUTE,
  assertSystemStatusContractSync,
  failClosedPublicPlatformStatus,
  mapPublicStatusToBadgeState,
  parsePublicPlatformStatus,
  resolveSystemStatusBackRoute,
  shouldDeferSystemStatus,
} from '../system-status-display-contract';

describe('system-status-display-contract', () => {
  it('keeps /status live after E10 and backs to support', () => {
    expect(SYSTEM_STATUS_ROUTE).toBe('/status');
    expect(SYSTEM_STATUS_PUBLIC_RPC).toBe('rpc_get_public_platform_status');
    expect(shouldDeferSystemStatus()).toBe(false);
    expect(resolveSystemStatusBackRoute()).toBe('/support');
    expect(() => assertSystemStatusContractSync()).not.toThrow();
  });

  it('fail-closes badge state away from settled when feed missing (C-02 residual)', () => {
    expect(SYSTEM_STATUS_FAIL_CLOSED_BADGE_STATE).toBe('pending');
    expect(SYSTEM_STATUS_FAIL_CLOSED_BADGE_STATE).not.toBe('settled');
    expect(failClosedPublicPlatformStatus().source).toBe('fail-closed');
    expect(failClosedPublicPlatformStatus().overall).toBe('unknown');
  });

  it('parses sanitized public status and maps badge states', () => {
    const parsed = parsePublicPlatformStatus({
      checkedAt: '2026-07-13T00:00:00.000Z',
      overall: 'degraded',
      lanes: [
        {
          id: 'earn',
          status: 'operational',
          reasonCategory: 'none',
          checkedAt: '2026-07-13T00:00:00.000Z',
        },
        {
          id: 'wallet',
          status: 'degraded',
          reasonCategory: 'feature_disabled',
          checkedAt: '2026-07-13T00:00:00.000Z',
        },
        {
          id: 'trade',
          status: 'outage',
          reasonCategory: 'market_halt',
          checkedAt: '2026-07-13T00:00:00.000Z',
        },
        {
          id: 'sports',
          status: 'unknown',
          reasonCategory: 'unknown',
          checkedAt: '2026-07-13T00:00:00.000Z',
        },
        {
          id: 'casino',
          status: 'operational',
          reasonCategory: 'none',
          checkedAt: '2026-07-13T00:00:00.000Z',
        },
      ],
    });
    expect(parsed?.source).toBe('live');
    expect(parsed?.overall).toBe('degraded');
    expect(parsed?.lanes).toHaveLength(5);
    expect(mapPublicStatusToBadgeState('operational')).toBe('settled');
    expect(mapPublicStatusToBadgeState('degraded')).toBe('halted');
    expect(mapPublicStatusToBadgeState('outage')).toBe('failed');
    expect(mapPublicStatusToBadgeState('unknown')).toBe('pending');
  });

  it('rejects malformed payloads (no inventing operational)', () => {
    expect(parsePublicPlatformStatus(null)).toBeNull();
    expect(parsePublicPlatformStatus({ overall: 'operational' })).toBeNull();
  });
});
