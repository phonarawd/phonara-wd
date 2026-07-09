import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const tokensDir = join(import.meta.dirname, '..');

describe('layout.css Orbit Grid (§34.10–34.11)', () => {
  it('defines desktop 12-col panel grid and col-span helpers', () => {
    const path = join(tokensDir, 'layout.css');
    expect(existsSync(path)).toBe(true);
    const css = readFileSync(path, 'utf8');
    expect(css).toContain('.ds-shell-panel-grid');
    expect(css).toContain('repeat(12, minmax(0, 1fr))');
    expect(css).toContain('.ds-shell-col-span-8');
    expect(css).toContain('.ds-shell-col-span-4');
    expect(css).toContain('.ds-shell-col-span-12');
  });

  it('is imported from tokens index.css', () => {
    const index = readFileSync(join(tokensDir, 'index.css'), 'utf8');
    expect(index).toContain('layout.css');
  });
});
