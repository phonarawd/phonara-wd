import { describe, expect, it } from 'vitest';

import {
  assertTradeDeskLaunchRcSync,
  listTradeLaunchRcComplaintSignoffRows,
  listTradeLaunchRcToastSignoffRows,
  TRADE_DESK_LAUNCH_RC_TODO,
  TRADE_LAUNCH_RC_CI_JOBS,
  TRADE_LAUNCH_RC_DEFERRED_TOAST_OWNER_TODOS,
  TRADE_LAUNCH_RC_E2E_SPEC,
  TRADE_LAUNCH_RC_GATE_TEST_PATHS,
  TRADE_LAUNCH_RC_OUT_OF_SCOPE_COMPLAINT_IDS,
  TRADE_LAUNCH_RC_PREREQUISITE_TODOS,
  TRADE_LAUNCH_RC_SIGNOFF_DOC,
  TRADE_LAUNCH_RC_SOAK_REMEDIATE_SCRIPT,
  TRADE_LAUNCH_RC_SOAK_SPOTCHECK_SCRIPT,
  TRADE_LAUNCH_RC_SURFACE_ROUTES,
  TRADE_LAUNCH_RC_VIEWPORT_WIDTHS,
} from '../trade-desk-launch-rc-display-contract';
import { findTradeComplaintRisk } from '../trade-exchange-parity-display-contract';
import { findTradeToastRegistryRow } from '../trade-toast-display-contract';

describe('trade-desk-launch-rc-display-contract · Phase 4 Tier 2', () => {
  it('registers Launch RC todo id and S4 viewport surfaces', () => {
    expect(TRADE_DESK_LAUNCH_RC_TODO).toBe('phase-4-launch-rc');
    expect(TRADE_LAUNCH_RC_VIEWPORT_WIDTHS).toEqual([375, 390, 768, 1024]);
    expect(TRADE_LAUNCH_RC_SURFACE_ROUTES).toEqual([
      '/trade',
      '/trade/futures',
      '/staking',
      '/staking/positions',
    ]);
  });

  it('lists prerequisite todos and CI authoritative jobs', () => {
    expect(TRADE_LAUNCH_RC_PREREQUISITE_TODOS).toEqual(
      expect.arrayContaining(['phase-3-e2e', 'p9-operator-visual-signoff']),
    );
    expect(TRADE_LAUNCH_RC_CI_JOBS).toEqual(['quality', 'sql', 'e2e', 'advisors', 'check:full']);
    expect(TRADE_LAUNCH_RC_E2E_SPEC).toBe('tests/e2e/trade-desk-smoke.spec.ts');
  });

  it('maps complaint registry signoff rows for Launch scope (excludes P10 deferrals)', () => {
    const rows = listTradeLaunchRcComplaintSignoffRows();
    expect(rows.length).toBeGreaterThanOrEqual(20);
    for (const outOfScope of TRADE_LAUNCH_RC_OUT_OF_SCOPE_COMPLAINT_IDS) {
      expect(rows.some((row) => row.id === outOfScope)).toBe(false);
      expect(findTradeComplaintRisk(outOfScope)).toBeDefined();
    }
    for (const row of rows) {
      expect(row.signoffStatus).toBe('agent_confirmed');
      expect(['live', 'disabled', 'disabled+key', 'built_hidden']).toContain(row.mitigatedBy);
    }
    expect(findTradeComplaintRisk('trade-feedback-silent-fail')?.mitigatedBy).toBe('live');
    expect(findTradeComplaintRisk('trade-feedback-double-toast')?.mitigatedBy).toBe('live');
  });

  it('maps toast registry signoff rows with T2-only deferred allowance', () => {
    const rows = listTradeLaunchRcToastSignoffRows();
    expect(rows.length).toBeGreaterThanOrEqual(20);
    for (const row of rows) {
      expect(row.signoffStatus).toBe('agent_confirmed');
    }
    expect(findTradeToastRegistryRow('futures.sltp.updated')?.implemented).toBe('yes');
    expect(findTradeToastRegistryRow('futures.funding.applied')?.implemented).toBe('deferred');
    for (const ownerTodo of TRADE_LAUNCH_RC_DEFERRED_TOAST_OWNER_TODOS) {
      expect(ownerTodo).toBe('engine-t2-futures-completion');
    }
    expect(findTradeToastRegistryRow('spot.market.buy')?.implemented).toBe('yes');
  });

  it('registers gate paths and operator soak/signoff artifacts', () => {
    expect(TRADE_LAUNCH_RC_GATE_TEST_PATHS.length).toBeGreaterThanOrEqual(2);
    expect(TRADE_LAUNCH_RC_SOAK_SPOTCHECK_SCRIPT).toBe(
      'scripts/trade-desk-launch-rc-soak-spotcheck.sql',
    );
    expect(TRADE_LAUNCH_RC_SOAK_REMEDIATE_SCRIPT).toBe(
      'scripts/trade-desk-launch-rc-soak-remediate.sql',
    );
    expect(TRADE_LAUNCH_RC_SIGNOFF_DOC).toBe('docs/OPERATIONS/TRADE_DESK_LAUNCH_RC_SIGNOFF.md');
  });

  it('passes assertTradeDeskLaunchRcSync bundle guard', () => {
    expect(() => assertTradeDeskLaunchRcSync()).not.toThrow();
  });
});
