import { describe, expect, it } from 'vitest';

import {
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
});
