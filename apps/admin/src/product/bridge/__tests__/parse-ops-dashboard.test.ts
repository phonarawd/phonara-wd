import { describe, expect, it } from 'vitest';

import {
  parseOpsDashboard,
  sortExceptionQueuesByCanon,
} from '@/product/bridge/parse-ops-dashboard';

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

  it('sorts exception queues by ADMIN_UX_CANON §3 order (not count-desc)', () => {
    const parsed = parseOpsDashboard({
      overallStatus: 'ok',
      fetchedAt: '2026-07-25T00:00:00.000Z',
      exceptionQueues: [
        { queueType: 'aml', openCount: 9, overdueCount: 0 },
        { queueType: 'deposit', openCount: 4, overdueCount: 1 },
        { queueType: 'withdrawal', openCount: 1, overdueCount: 0 },
        { queueType: 'kyc', openCount: 2, overdueCount: 0 },
      ],
      opsAlerts: { open: 0, critical: 0 },
      healthChecks: [],
    });

    expect(parsed.exceptionQueues.map((row) => row.queueType)).toEqual([
      'withdrawal',
      'deposit',
      'kyc',
      'aml',
    ]);
  });

  it('sortExceptionQueuesByCanon keeps unknown types after known canon order', () => {
    const sorted = sortExceptionQueuesByCanon([
      { queueType: 'mystery', openCount: 50, overdueCount: 0 },
      { queueType: 'withdrawal', openCount: 1, overdueCount: 0 },
    ]);
    expect(sorted.map((row) => row.queueType)).toEqual(['withdrawal', 'mystery']);
  });

  it('throws on invalid payload', () => {
    expect(() => parseOpsDashboard(null)).toThrow('invalid_ops_dashboard');
  });
});
