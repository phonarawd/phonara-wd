import { describe, expect, it } from 'vitest';

import {
  SYSTEM_STATUS_ROUTE,
  assertSystemStatusContractSync,
  resolveSystemStatusBackRoute,
  shouldDeferSystemStatus,
} from '../system-status-display-contract';

describe('system-status-display-contract', () => {
  it('defers /status until E10 and backs to support', () => {
    expect(SYSTEM_STATUS_ROUTE).toBe('/status');
    expect(shouldDeferSystemStatus()).toBe(true);
    expect(resolveSystemStatusBackRoute()).toBe('/support');
    expect(() => assertSystemStatusContractSync()).not.toThrow();
  });
});
