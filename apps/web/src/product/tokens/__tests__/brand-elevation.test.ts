import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const tokensDir = join(import.meta.dirname, '..');

describe('brand-elevation.css (§34.18–34.20)', () => {
  it('defines aurora mark · domain empty · Quad Stream loading signatures', () => {
    const path = join(tokensDir, 'brand-elevation.css');
    expect(existsSync(path)).toBe(true);
    const css = readFileSync(path, 'utf8');
    expect(css).toContain('.ds-brand-mark-aurora');
    expect(css).toContain('--ds-brand-axis-earn');
    expect(css).toContain('--ds-brand-axis-trading');
    expect(css).toContain('--ds-brand-axis-sports');
    expect(css).toContain('--ds-brand-axis-casino');
    expect(css).toContain('.ds-domain-empty-mark');
    expect(css).toContain('.ds-quad-stream-loading');
    expect(css).toContain('prefers-reduced-motion');
  });

  it('is imported from tokens index.css', () => {
    const index = readFileSync(join(tokensDir, 'index.css'), 'utf8');
    expect(index).toContain('brand-elevation.css');
  });
});
