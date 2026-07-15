import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { assertPlatformR11CloseoutSync } from '../../apps/web/src/domain/platform-r11-closeout-display-contract';

describe('platform-r11-closeout scripts', () => {
  it('PLATFORM_RELEASE_FREEZE.yaml has required freeze fields', () => {
    const yaml = readFileSync(resolve('docs/OPERATIONS/PLATFORM_RELEASE_FREEZE.yaml'), 'utf8');
    expect(yaml).toContain('freeze_status: active');
    expect(yaml).toContain('rc_sha:');
    expect(yaml).toContain('release_candidate: blocked');
    expect(yaml).toContain('R9-PERF-JS');
    expect(yaml).toContain('three-owner-signoff');
  });

  it('R11 closeout evidence index exists', () => {
    const md = readFileSync(
      resolve('docs/OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R11/r11-closeout-implement.md'),
      'utf8',
    );
    expect(md).toContain('audit-r11-closeout');
    expect(md).toContain('dcfd8c7e');
    expect(md).toContain('BLOCKED');
  });

  it('display contract sync passes', () => {
    expect(() => assertPlatformR11CloseoutSync()).not.toThrow();
  });
});
