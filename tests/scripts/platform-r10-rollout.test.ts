import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { assertPlatformR10RolloutSync } from '../../apps/web/src/domain/platform-r10-rollout-display-contract';

describe('platform-r10-rollout scripts', () => {
  it('PLATFORM_R10_ROLLOUT_SOAK.yaml has required soak fields', () => {
    const yaml = readFileSync(resolve('docs/OPERATIONS/PLATFORM_R10_ROLLOUT_SOAK.yaml'), 'utf8');
    expect(yaml).toContain('soak_window_hours: 24');
    expect(yaml).toContain('five_conditions:');
    expect(yaml).toContain('rollout_stages:');
    expect(yaml).toContain('baseline-soak');
    expect(yaml).toContain('withdrawal');
  });

  it('spotcheck SQL is read-only (ROLLBACK)', () => {
    const sql = readFileSync(resolve('scripts/platform-r10-rollout-spotcheck.sql'), 'utf8');
    expect(sql).toContain('BEGIN;');
    expect(sql).toContain('ROLLBACK;');
    expect(sql).toContain('feature_withdrawal_enabled');
    expect(sql).not.toMatch(/\bINSERT\b/i);
    expect(sql).not.toMatch(/\bUPDATE\b/i);
    expect(sql).not.toMatch(/\bDELETE\b/i);
  });

  it('display contract sync passes', () => {
    expect(() => assertPlatformR10RolloutSync()).not.toThrow();
  });
});
