import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  ADMIN_SUPPORT_DESK_FULL_PATH,
  ADMIN_SUPPORT_DESK_ROUTE,
  ADMIN_SUPPORT_DESK_RPCS,
  ADMIN_SUPPORT_QUEUES_CONVERGENCE,
  assertEwE9AdminSupportDeskSync,
  canAccessAdminSupportDesk,
  EW_E9_ADMIN_SUPPORT_ARTIFACT_PATHS,
  EW_E9_ADMIN_SUPPORT_TEST_PATHS,
  EW_E9_PAGE_ADMIN_SUPPORT_NEXT_TODO,
  EW_E9_PAGE_ADMIN_SUPPORT_PREREQUISITE_TODO,
  EW_E9_PAGE_ADMIN_SUPPORT_TODO,
  isAdminSupportOpenStatus,
} from '../admin-support-desk-display-contract';

const REPO_ROOT = resolve(import.meta.dirname, '../../../../..');

describe('admin-support-desk-display-contract (E9 · ew-e9-page-admin-support)', () => {
  it('pins todo · prerequisite GATE · next E10 wave', () => {
    expect(EW_E9_PAGE_ADMIN_SUPPORT_TODO).toBe('ew-e9-page-admin-support');
    expect(EW_E9_PAGE_ADMIN_SUPPORT_PREREQUISITE_TODO).toBe('ew-e9-gate-identity-support');
    expect(EW_E9_PAGE_ADMIN_SUPPORT_NEXT_TODO).toBe('ew-e10-platform-engine-wave');
    expect(() => assertEwE9AdminSupportDeskSync()).not.toThrow();
  });

  it('wires desk route · RPCs · queues convergence', () => {
    expect(ADMIN_SUPPORT_DESK_ROUTE).toBe('/support');
    expect(ADMIN_SUPPORT_DESK_FULL_PATH).toBe('/admin/support');
    expect(ADMIN_SUPPORT_DESK_RPCS).toEqual([
      'rpc_admin_list_support_tickets',
      'rpc_admin_resolve_support_ticket',
      'rpc_get_support_ticket',
    ]);
    expect(ADMIN_SUPPORT_QUEUES_CONVERGENCE).toBe(true);
    expect(isAdminSupportOpenStatus('open')).toBe(true);
    expect(isAdminSupportOpenStatus('resolved')).toBe(false);
  });

  it('allows owner + support · denies viewer/finance', () => {
    expect(canAccessAdminSupportDesk('owner')).toBe(true);
    expect(canAccessAdminSupportDesk('support')).toBe(true);
    expect(canAccessAdminSupportDesk('viewer')).toBe(false);
    expect(canAccessAdminSupportDesk('finance')).toBe(false);
    expect(canAccessAdminSupportDesk('risk')).toBe(false);
  });

  it('requires artifacts on disk', () => {
    for (const rel of EW_E9_ADMIN_SUPPORT_ARTIFACT_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }
    for (const rel of EW_E9_ADMIN_SUPPORT_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }
  });

  it('ops doc pins todo · RPCs · queues', () => {
    const ops = readFileSync(
      resolve(REPO_ROOT, 'docs/OPERATIONS/ENGINE_GAP_E9_ADMIN_SUPPORT.md'),
      'utf8',
    );
    expect(ops).toContain('ew-e9-page-admin-support');
    expect(ops).toContain('rpc_admin_list_support_tickets');
    expect(ops).toContain('rpc_admin_resolve_support_ticket');
    expect(ops).toContain('/admin/queues');
    expect(ops).toContain('/admin/support');
  });
});
