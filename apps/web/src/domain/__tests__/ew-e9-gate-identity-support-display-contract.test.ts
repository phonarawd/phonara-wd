import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { LAUNCH_GATES } from '../../lib/launch-gates';
import {
  EW_E9_GATE_APP_INSTALL_ENUM_REMOTE_MIGRATION_NAME,
  EW_E9_GATE_APP_INSTALL_ENUM_REMOTE_TAIL,
  EW_E9_GATE_IDENTITY_ARTIFACT_PATHS,
  EW_E9_GATE_IDENTITY_NEXT_TODO,
  EW_E9_GATE_IDENTITY_PREREQUISITE_TODO,
  EW_E9_GATE_IDENTITY_REMOTE_MIGRATION_NAME,
  EW_E9_GATE_IDENTITY_REMOTE_TAIL,
  EW_E9_GATE_IDENTITY_SQL_TEST,
  EW_E9_GATE_IDENTITY_TEST_PATHS,
  EW_E9_GATE_IDENTITY_TODO,
  EW_E9_GATE_UI_UNLOCK_WIRE_STATUS,
  assertEwE9GateIdentitySync,
  isAppInstallMissionEnginePathReady,
  isEwE9IdentityGateReady,
  isExistsIdentityGrowthPinned,
  isProductAnalyticsEnginePathReady,
  isSiweWalletLoginEnginePathReady,
  isSupportTicketsEnginePathReady,
  isTierLeaderboardEnginePathReady,
} from '../ew-e9-gate-identity-support-display-contract';
import {
  EW_E9_CREATE_SIWE_CHALLENGE_RPC,
  EW_E9_CREATE_SUPPORT_TICKET_RPC,
  EW_E9_IDENTITY_NEXT_TODO,
  EW_E9_IDENTITY_TODO,
  EW_E9_RECORD_ANALYTICS_RPC,
  EW_E9_RECORD_APP_INSTALL_RPC,
  EW_E9_SIWE_EDGE_FUNCTION,
  EW_E9_TIER_LEADERBOARD_RPC,
  isEwE9IdentityEngineReady,
} from '../ew-e9-identity-support-display-contract';

const REPO_ROOT = resolve(import.meta.dirname, '../../../../..');

function readRepo(rel: string): string {
  return readFileSync(resolve(REPO_ROOT, rel), 'utf8');
}

describe('ew-e9-gate-identity-support-display-contract (E9 GATE)', () => {
  it('pins GATE todo · WAVE prerequisite · next admin support desk', () => {
    expect(EW_E9_GATE_IDENTITY_TODO).toBe('ew-e9-gate-identity-support');
    expect(EW_E9_GATE_IDENTITY_PREREQUISITE_TODO).toBe(EW_E9_IDENTITY_TODO);
    expect(EW_E9_GATE_IDENTITY_NEXT_TODO).toBe('ew-e9-page-admin-support');
    expect(EW_E9_IDENTITY_NEXT_TODO).toBe('ew-e9-gate-identity-support');
    expect(EW_E9_GATE_IDENTITY_REMOTE_MIGRATION_NAME).toBe(
      'ew_e9_identity_support',
    );
    expect(EW_E9_GATE_APP_INSTALL_ENUM_REMOTE_MIGRATION_NAME).toBe(
      'ew_e9_app_install_enum',
    );
    expect(EW_E9_GATE_IDENTITY_REMOTE_TAIL).toContain('ew_e9_identity_support');
    expect(EW_E9_GATE_APP_INSTALL_ENUM_REMOTE_TAIL).toContain(
      'ew_e9_app_install_enum',
    );
    expect(EW_E9_GATE_IDENTITY_SQL_TEST).toContain('ew_e9_identity_support_test');
    expect(() => assertEwE9GateIdentitySync()).not.toThrow();
  });

  it('keeps hubs built_hidden · engine ready · EXISTS growth pinned', () => {
    expect(isEwE9IdentityGateReady()).toBe(true);
    expect(isEwE9IdentityEngineReady()).toBe(true);
    expect(isSiweWalletLoginEnginePathReady()).toBe(true);
    expect(isSupportTicketsEnginePathReady()).toBe(true);
    expect(isProductAnalyticsEnginePathReady()).toBe(true);
    expect(isAppInstallMissionEnginePathReady()).toBe(true);
    expect(isTierLeaderboardEnginePathReady()).toBe(true);
    expect(isExistsIdentityGrowthPinned()).toBe(true);
    expect(LAUNCH_GATES.identitySupportEngine).toBe(true);
    expect(LAUNCH_GATES.siweLoginLive).toBe(false);
    expect(LAUNCH_GATES.supportTicketsLive).toBe(false);
    expect(LAUNCH_GATES.tierLeaderboardLive).toBe(false);
    expect(LAUNCH_GATES.appInstallMissionLive).toBe(false);
    expect(EW_E9_GATE_UI_UNLOCK_WIRE_STATUS.siwe_login_surface).toBe(
      'built_hidden',
    );
    expect(EW_E9_GATE_UI_UNLOCK_WIRE_STATUS.support_ticket_hub).toBe(
      'built_hidden',
    );
    expect(EW_E9_GATE_UI_UNLOCK_WIRE_STATUS.tier_leaderboard_hub).toBe(
      'built_hidden',
    );
    expect(EW_E9_GATE_UI_UNLOCK_WIRE_STATUS.app_install_mission_tab).toBe(
      'built_hidden',
    );
    expect(EW_E9_CREATE_SIWE_CHALLENGE_RPC).toBe('rpc_create_siwe_challenge');
    expect(EW_E9_CREATE_SUPPORT_TICKET_RPC).toBe('rpc_create_support_ticket');
    expect(EW_E9_RECORD_ANALYTICS_RPC).toBe(
      'rpc_record_product_analytics_event',
    );
    expect(EW_E9_RECORD_APP_INSTALL_RPC).toBe(
      'rpc_record_app_install_attribution',
    );
    expect(EW_E9_TIER_LEADERBOARD_RPC).toBe('rpc_get_tier_leaderboard');
    expect(EW_E9_SIWE_EDGE_FUNCTION).toBe('siwe-auth');
  });

  it('requires GATE artifacts · SQL E9-0..E9-5 · remote/advisor docs', () => {
    for (const rel of EW_E9_GATE_IDENTITY_ARTIFACT_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
      expect(readRepo(rel).length).toBeGreaterThan(40);
    }
    for (const rel of EW_E9_GATE_IDENTITY_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }

    const sqlTest = readRepo(EW_E9_GATE_IDENTITY_SQL_TEST);
    expect(sqlTest).toContain('E9-0');
    expect(sqlTest).toContain('E9-5');
    expect(sqlTest).toContain('rpc_create_siwe_challenge');
    expect(sqlTest).toContain('rpc_create_support_ticket');
    expect(sqlTest).toContain('rpc_record_product_analytics_event');
    expect(sqlTest).toContain('rpc_record_app_install_attribution');
    expect(sqlTest).toContain('rpc_get_tier_leaderboard');

    const ops = readRepo(
      'docs/OPERATIONS/ENGINE_GAP_E9_GATE_IDENTITY_SUPPORT.md',
    );
    expect(ops).toContain(EW_E9_GATE_IDENTITY_TODO);
    expect(ops).toContain('stack:push-remote');
    expect(ops).toContain('advisor');
    expect(ops).toContain('rpc_create_siwe_challenge');
    expect(ops).toContain('ew_e9_identity_support_test');
    expect(ops).toContain('ew-e9-page-admin-support');
    expect(ops).toContain(EW_E9_GATE_IDENTITY_REMOTE_TAIL);
    expect(ops).toContain(EW_E9_GATE_APP_INSTALL_ENUM_REMOTE_TAIL);
  });
});
