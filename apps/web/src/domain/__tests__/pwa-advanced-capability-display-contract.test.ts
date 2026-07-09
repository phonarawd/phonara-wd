import { describe, expect, it } from 'vitest';
import {
  countExistingPwaBaselineCapabilities,
  countMissingPwaAdvancedCapabilities,
  getPwaAdvancedLaunchBlockers,
  isPwaAdvancedNetNewBranch,
  PWA_ADVANCED_BROWSER_SUPPORT,
  PWA_ADVANCED_CAPABILITY_BRANCHES,
  PWA_ADVANCED_IMPLEMENTATION_BACKLOG,
  PWA_ADVANCED_SURFACE_PLACEMENT,
  PWA_ADVANCED_UI_WIRE_STATUS,
  PWA_SHARE_TARGET_ROUTE,
  requiresEngineRpcForPwaAdvanced,
  resolvePwaAdvancedBranchExposure,
  shouldDeferPwaAdvancedNetNewImplementation,
} from '../pwa-advanced-capability-display-contract';

describe('pwa-advanced-capability-display-contract', () => {
  it('documents EXISTS baseline PWA (shortcuts · offline · SW update · push)', () => {
    expect(PWA_ADVANCED_CAPABILITY_BRANCHES.app_shortcuts.engine).toBe('exists');
    expect(PWA_ADVANCED_CAPABILITY_BRANCHES.offline_fallback.engine).toBe('exists');
    expect(PWA_ADVANCED_CAPABILITY_BRANCHES.sw_update_toast.engine).toBe('exists');
    expect(PWA_ADVANCED_CAPABILITY_BRANCHES.web_push_sw.engine).toBe('exists');
    expect(countExistingPwaBaselineCapabilities()).toBeGreaterThanOrEqual(4);
  });

  it('confirms MISSING net-new capabilities (plan §21.0)', () => {
    expect(PWA_ADVANCED_CAPABILITY_BRANCHES.share_target.engine).toBe('missing');
    expect(PWA_ADVANCED_CAPABILITY_BRANCHES.app_badging.engine).toBe('missing');
    expect(PWA_ADVANCED_CAPABILITY_BRANCHES.periodic_background_sync.engine).toBe('missing');
    expect(PWA_ADVANCED_CAPABILITY_BRANCHES.file_handlers.engine).toBe('missing');
    expect(PWA_ADVANCED_CAPABILITY_BRANCHES.protocol_handlers.engine).toBe('missing');
    expect(countMissingPwaAdvancedCapabilities()).toBeGreaterThanOrEqual(5);
  });

  it('locks front-end-only scope — no engine/RPC for any branch', () => {
    const branches = Object.keys(PWA_ADVANCED_CAPABILITY_BRANCHES) as Array<
      keyof typeof PWA_ADVANCED_CAPABILITY_BRANCHES
    >;
    for (const branch of branches) {
      expect(requiresEngineRpcForPwaAdvanced(branch)).toBe(false);
      expect(PWA_ADVANCED_CAPABILITY_BRANCHES[branch].moneyPath).toBe(false);
    }
  });

  it('prioritizes Share Target and App Badging as HIGH launch blockers', () => {
    expect(PWA_ADVANCED_CAPABILITY_BRANCHES.share_target.implementationPriority).toBe('high');
    expect(PWA_ADVANCED_CAPABILITY_BRANCHES.app_badging.implementationPriority).toBe('high');
    expect(getPwaAdvancedLaunchBlockers()).toEqual(['share_target', 'app_badging']);
    expect(
      PWA_ADVANCED_IMPLEMENTATION_BACKLOG.filter((row) => row.priority === 'high'),
    ).toHaveLength(2);
  });

  it('marks file/protocol handlers as LOW backlog', () => {
    expect(PWA_ADVANCED_CAPABILITY_BRANCHES.file_handlers.implementationPriority).toBe('low');
    expect(PWA_ADVANCED_CAPABILITY_BRANCHES.protocol_handlers.implementationPriority).toBe('low');
    expect(resolvePwaAdvancedBranchExposure('file_handlers')).toBe('backlog');
    expect(PWA_ADVANCED_UI_WIRE_STATUS.file_handler_route).toBe('backlog');
  });

  it('places Phase 8 owners on /install · /settings · /share', () => {
    const routes = new Set(PWA_ADVANCED_SURFACE_PLACEMENT.map((row) => row.route));
    expect(routes).toContain('/install');
    expect(routes).toContain('/settings');
    expect(routes).toContain(PWA_SHARE_TARGET_ROUTE);
    expect(
      PWA_ADVANCED_SURFACE_PLACEMENT.every((row) => row.phase8Todo.startsWith('p8-route-')),
    ).toBe(true);
  });

  it('documents browser support matrix for progressive enhancement', () => {
    expect(PWA_ADVANCED_BROWSER_SUPPORT.share_target.chromeAndroid).toBe('full');
    expect(PWA_ADVANCED_BROWSER_SUPPORT.share_target.safariIos).toBe('none');
    expect(PWA_ADVANCED_BROWSER_SUPPORT.app_badging.firefox).toBe('none');
    expect(PWA_ADVANCED_BROWSER_SUPPORT.periodic_background_sync.chromeDesktop).toBe('none');
  });

  it('defers net-new implementation until Phase 8 (discovery scope lock)', () => {
    expect(shouldDeferPwaAdvancedNetNewImplementation()).toBe(true);
    expect(resolvePwaAdvancedBranchExposure('share_target')).toBe('defer_stub');
    expect(resolvePwaAdvancedBranchExposure('app_badging')).toBe('defer_stub');
    expect(PWA_ADVANCED_UI_WIRE_STATUS.share_target_receiver).toBe('defer_stub');
    expect(isPwaAdvancedNetNewBranch('app_shortcuts')).toBe(false);
    expect(isPwaAdvancedNetNewBranch('share_target')).toBe(true);
  });
});
