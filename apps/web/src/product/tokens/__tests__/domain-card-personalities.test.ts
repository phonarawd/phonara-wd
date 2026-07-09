import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const tokensDir = join(import.meta.dirname, '..');

describe('domain-card-personalities.css (§34.17)', () => {
  it('defines signature styles for all six domain variants', () => {
    const path = join(tokensDir, 'domain-card-personalities.css');
    expect(existsSync(path)).toBe(true);
    const css = readFileSync(path, 'utf8');
    for (const variant of [
      'mission',
      'wallet-hero',
      'vip',
      'trade-dense',
      'sports-odds',
      'casino-play',
    ]) {
      expect(css).toContain(`[data-card-variant='${variant}']`);
    }
    expect(css).toContain('heatmap');
    expect(css).toContain('prefers-reduced-motion');
  });

  it('is imported from tokens index.css', () => {
    const index = readFileSync(join(tokensDir, 'index.css'), 'utf8');
    expect(index).toContain('domain-card-personalities.css');
  });
});
