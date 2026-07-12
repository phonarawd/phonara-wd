import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  assertPlatformR12PostReleaseSync,
  platformR12PprDueAt,
} from '../../apps/web/src/domain/platform-r12-post-release-display-contract';

describe('platform-r12-post-release scripts', () => {
  it('PLATFORM_POST_RELEASE_REVIEW.yaml has required PPR fields', () => {
    const yaml = readFileSync(resolve('docs/OPERATIONS/PLATFORM_POST_RELEASE_REVIEW.yaml'), 'utf8');
    expect(yaml).toContain('plan_todo: audit-r12-post-release');
    expect(yaml).toContain('production_normal: pending_ppr');
    expect(yaml).toContain('prr-24h');
    expect(yaml).toContain('prr-72h');
    expect(yaml).toContain('prr-7d');
    expect(yaml).toContain('2026-07-14T09:00:00+09:00');
  });

  it('PLATFORM_SECRETS_ROTATION.yaml has rotation rows', () => {
    const yaml = readFileSync(resolve('docs/OPERATIONS/PLATFORM_SECRETS_ROTATION.yaml'), 'utf8');
    expect(yaml).toContain('SEC-SERVICE-ROLE');
    expect(yaml).toContain('rotation_policy_days: 90');
    expect(yaml).toContain('r12-secrets-rotation-spotcheck.md');
  });

  it('R12 post-release evidence index exists', () => {
    const md = readFileSync(
      resolve('docs/OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R12/r12-post-release-implement.md'),
      'utf8',
    );
    expect(md).toContain('audit-r12-post-release');
    expect(md).toContain('pending_ppr');
    expect(md).toContain('19/19');
  });

  it('display contract sync passes and matches yaml due dates', () => {
    expect(() => assertPlatformR12PostReleaseSync()).not.toThrow();
    expect(platformR12PprDueAt(24)).toBe('2026-07-14T09:00:00+09:00');
  });
});
