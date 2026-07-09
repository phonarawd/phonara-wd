import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const tokensDir = join(import.meta.dirname, '..');

describe('elevation.css (§34.6)', () => {
  it('defines shadow 1–4 and z chrome/overlay/toast', () => {
    const path = join(tokensDir, 'elevation.css');
    expect(existsSync(path)).toBe(true);
    const css = readFileSync(path, 'utf8');
    for (const token of [
      '--ds-shadow-1',
      '--ds-shadow-2',
      '--ds-shadow-3',
      '--ds-shadow-4',
      '--ds-shadow-overlay',
      '--ds-z-chrome',
      '--ds-z-overlay',
      '--ds-z-toast',
    ]) {
      expect(css).toContain(`${token}:`);
    }
  });

  it('is imported from tokens index.css', () => {
    const index = readFileSync(join(tokensDir, 'index.css'), 'utf8');
    expect(index).toContain('elevation.css');
  });

  it('theme bridges shadow-1..4 and z-index ladder', () => {
    const theme = readFileSync(join(tokensDir, 'theme.css'), 'utf8');
    expect(theme).toContain('--shadow-1: var(--ds-shadow-1)');
    expect(theme).toContain('--shadow-4: var(--ds-shadow-4)');
    expect(theme).toContain('--z-index-chrome: var(--ds-z-chrome)');
    expect(theme).toContain('--z-index-toast: var(--ds-z-toast)');
  });
});
