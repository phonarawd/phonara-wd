import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { LAUNCH_GATES } from '../../lib/launch-gates';
import {
  assertEwE10TrustSupportUiSync,
  EW_E10_TRUST_SUPPORT_UI_ARTIFACT_PATHS,
  EW_E10_TRUST_SUPPORT_UI_NEXT_TODO,
  EW_E10_TRUST_SUPPORT_UI_PREREQUISITE_TODO,
  EW_E10_TRUST_SUPPORT_UI_TEST_PATHS,
  EW_E10_TRUST_SUPPORT_UI_TODO,
  isEwE10TrustSupportUiUnlocked,
} from '../ew-e10-trust-support-ui-display-contract';
import { resolveEwE9GateUiUnlockWireStatus } from '../ew-e9-gate-identity-support-display-contract';
import { isSupportTicketHubLive } from '../support-hub-display-contract';
import { isSystemStatusLive } from '../system-status-display-contract';
import { isTierLeaderboardRankListLive } from '../tier-leaderboard-display-contract';

const REPO_ROOT = resolve(import.meta.dirname, '../../../../..');

describe('ew-e10-trust-support-ui-display-contract', () => {
  it('pins todo · prerequisite · next · live unlock', () => {
    expect(EW_E10_TRUST_SUPPORT_UI_TODO).toBe('ew-e10-trust-support-ui');
    expect(EW_E10_TRUST_SUPPORT_UI_PREREQUISITE_TODO).toBe('ew-e10-wallet-settings-ui');
    expect(EW_E10_TRUST_SUPPORT_UI_NEXT_TODO).toBe('ew-e10-growth-ui');
    expect(LAUNCH_GATES.supportTicketsLive).toBe(true);
    expect(LAUNCH_GATES.tierLeaderboardLive).toBe(true);
    expect(LAUNCH_GATES.systemStatusLive).toBe(true);
    expect(isEwE10TrustSupportUiUnlocked()).toBe(true);
    expect(() => assertEwE10TrustSupportUiSync()).not.toThrow();
  });

  it('wires ticket · status · tier leaderboard live', () => {
    const wire = resolveEwE9GateUiUnlockWireStatus();
    expect(wire.support_ticket_hub).toBe('live');
    expect(wire.tier_leaderboard_hub).toBe('live');
    expect(isSupportTicketHubLive()).toBe(true);
    expect(isSystemStatusLive()).toBe(true);
    expect(isTierLeaderboardRankListLive()).toBe(true);
  });

  it('requires artifacts on disk', () => {
    for (const rel of EW_E10_TRUST_SUPPORT_UI_ARTIFACT_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
      expect(readFileSync(resolve(REPO_ROOT, rel), 'utf8').length).toBeGreaterThan(40);
    }
    for (const rel of EW_E10_TRUST_SUPPORT_UI_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }
  });
});
