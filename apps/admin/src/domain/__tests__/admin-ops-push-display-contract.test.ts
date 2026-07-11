import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { messages } from '@phonara/i18n';

import {
  ADMIN_OPS_PUSH_DEEP_LINK_FULL_PATH,
  ADMIN_OPS_PUSH_DEEP_LINK_ROUTE,
  ADMIN_OPS_PUSH_EDGE_FUNCTION,
  ADMIN_OPS_PUSH_I18N_KEYS,
  ADMIN_OPS_PUSH_SUBSCRIPTIONS_TABLE,
  assertP13AdminOpsPushSync,
  buildAdminOpsPushPayload,
  P13_ADMIN_OPS_PUSH_ARTIFACT_PATHS,
  P13_ADMIN_OPS_PUSH_NEXT_TODO,
  P13_ADMIN_OPS_PUSH_PREREQUISITE_TODO,
  P13_ADMIN_OPS_PUSH_TEST_PATHS,
  P13_ADMIN_OPS_PUSH_TODO,
} from '../admin-ops-push-display-contract';

const ADMIN_SRC = resolve(import.meta.dirname, '../..');
const REPO_ROOT = resolve(ADMIN_SRC, '../../..');

const ko = messages.ko as Record<string, string>;
const en = messages.en as Record<string, string>;

describe('admin-ops-push-display-contract (§32.6 Gap A-4 · YAML #231)', () => {
  it('registers ops push todo · queues deep-link · engine reuse', () => {
    expect(P13_ADMIN_OPS_PUSH_TODO).toBe('p13-admin-ops-push');
    expect(P13_ADMIN_OPS_PUSH_PREREQUISITE_TODO).toBe('p13-prep-admin-team-desk');
    expect(P13_ADMIN_OPS_PUSH_NEXT_TODO).toBe('p13-ops-prod-preflight');
    expect(ADMIN_OPS_PUSH_DEEP_LINK_ROUTE).toBe('/queues');
    expect(ADMIN_OPS_PUSH_DEEP_LINK_FULL_PATH).toBe('/admin/queues');
    expect(ADMIN_OPS_PUSH_SUBSCRIPTIONS_TABLE).toBe('push_subscriptions');
    expect(ADMIN_OPS_PUSH_EDGE_FUNCTION).toBe('ops-notify');
    expect(() => assertP13AdminOpsPushSync()).not.toThrow();
  });

  it('builds push payload that opens 처리 대기함', () => {
    const payload = buildAdminOpsPushPayload({
      severity: 'critical',
      summary: 'Oracle stale',
      alertId: 'alert-1',
      notifyKind: 'immediate',
    });
    expect(payload.url).toBe('/queues');
    expect(payload.event_type).toBe('ops_alert');
    expect(payload.title).toContain('CRITICAL');
    expect(payload.body).toBe('Oracle stale');
    expect(payload.tag).toBe('ops-alert:alert-1');
  });

  it('pins surface · hook · SW · edge artifacts on disk', () => {
    for (const rel of P13_ADMIN_OPS_PUSH_ARTIFACT_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }
    for (const rel of P13_ADMIN_OPS_PUSH_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }
  });

  it('requires beginner i18n keys for ops push (ko+en)', () => {
    for (const key of ADMIN_OPS_PUSH_I18N_KEYS) {
      expect(ko[key], `ko ${key}`).toBeTruthy();
      expect(en[key], `en ${key}`).toBeTruthy();
    }
    expect(ko['admin.settings.push.enable']).toContain('알림');
    expect(ko['admin.settings.push.queuesHint']).toContain('처리 대기함');
  });
});
