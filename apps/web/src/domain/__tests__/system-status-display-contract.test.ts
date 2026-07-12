import { describe, expect, it } from 'vitest';

import {
  SYSTEM_STATUS_FAIL_CLOSED_BADGE_STATE,
  SYSTEM_STATUS_ROUTE,
  assertSystemStatusContractSync,
  resolveSystemStatusBackRoute,
  shouldDeferSystemStatus,
} from '../system-status-display-contract';

describe('system-status-display-contract', () => {
  it('keeps /status live after E10 and backs to support', () => {
    expect(SYSTEM_STATUS_ROUTE).toBe('/status');
    expect(shouldDeferSystemStatus()).toBe(false);
    expect(resolveSystemStatusBackRoute()).toBe('/support');
    expect(() => assertSystemStatusContractSync()).not.toThrow();
  });

  it('fail-closes badge state away from settled/operational (C-02)', () => {
    expect(SYSTEM_STATUS_FAIL_CLOSED_BADGE_STATE).toBe('pending');
    expect(SYSTEM_STATUS_FAIL_CLOSED_BADGE_STATE).not.toBe('settled');
  });
});
