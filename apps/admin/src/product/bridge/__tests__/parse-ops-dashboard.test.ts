import { describe, expect, it } from 'vitest';

import { parseOpsDashboard } from '@/product/bridge/parse-ops-dashboard';

describe('parseOpsDashboard', () => {
  it('parses dashboard shape from rpc_admin_get_ops_dashboard', () => {
    const parsed = parseOpsDashboard({
      overallStatus: 'warning',
      fetchedAt: '2026-07-04T10:00:00.000Z',
      exceptionQueues: [
        { queueType: 'withdrawal', openCount: 2, overdueCount: 1 },
        { queueType: 'deposit_exception', openCount: 0, overdueCount: 0 },
      ],
      opsAlerts: { open: 3, critical: 1 },
      healthChecks: [
        {
          id: 'pending_exceptions',
          status: 'warning',
          summary: '2 pending',
          observedAt: '2026-07-04T09:55:00.000Z',
          runbookKey: 'ops.pending',
        },
      ],
    });

    expect(parsed.overallStatus).toBe('warning');
    expect(parsed.exceptionQueues).toHaveLength(2);
    expect(parsed.opsAlerts.open).toBe(3);
    expect(parsed.healthChecks[0]?.id).toBe('pending_exceptions');
  });

  it('throws on invalid payload', () => {
    expect(() => parseOpsDashboard(null)).toThrow('invalid_ops_dashboard');
  });
});
