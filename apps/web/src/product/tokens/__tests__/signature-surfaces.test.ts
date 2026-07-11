import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const tokensDir = join(import.meta.dirname, '..');

describe('signature-surfaces.css (§34.21–34.26)', () => {
  it('defines trade heat · volume pulse · casino float · reduced-motion', () => {
    const path = join(tokensDir, 'signature-surfaces.css');
    expect(existsSync(path)).toBe(true);
    const css = readFileSync(path, 'utf8');
    expect(css).toContain("data-signature='market-heat-volume-pulse'");
    expect(css).toContain('ds-volume-pulse');
    expect(css).toContain("data-signature='tile-float-glow'");
    expect(css).toContain('ds-casino-tile-float');
    expect(css).toContain("data-signature='xp-fill'");
    expect(css).toContain("data-signature='living-balance'");
    expect(css).toContain('prefers-reduced-motion');
  });

  it('is imported from tokens index.css', () => {
    const index = readFileSync(join(tokensDir, 'index.css'), 'utf8');
    expect(index).toContain('signature-surfaces.css');
  });
});
