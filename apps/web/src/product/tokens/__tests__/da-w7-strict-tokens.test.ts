import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const tokensDir = join(import.meta.dirname, '..');
const repoRoot = join(tokensDir, '../../../../..');

describe('da-w7 strict tokens (§34.28)', () => {
  it('defines --ds-text-tiny and theme --text-tiny bridge', () => {
    const fonts = readFileSync(join(tokensDir, 'fonts.css'), 'utf8');
    const theme = readFileSync(join(tokensDir, 'theme.css'), 'utf8');
    expect(fonts).toMatch(/--ds-text-tiny\s*:\s*0\.625rem/);
    expect(theme).toContain('--text-tiny: var(--ds-text-tiny)');
  });

  it('purges P3 shadcn legacy color bridges', () => {
    const theme = readFileSync(join(tokensDir, 'theme.css'), 'utf8');
    expect(theme).not.toMatch(/--color-primary\s*:/);
    expect(theme).not.toMatch(/--color-muted-foreground\s*:/);
    expect(theme).toContain('--color-accent: var(--ds-accent)');
    expect(theme).toContain('--color-foreground-muted: var(--ds-foreground-muted)');
  });

  it('keeps check:design-tokens script as strict gate owner', () => {
    const script = join(repoRoot, 'scripts/check-design-tokens.ts');
    expect(existsSync(script)).toBe(true);
    const source = readFileSync(script, 'utf8');
    expect(source).toContain('--strict');
    expect(source).toContain('text-[10px]');
    expect(source).toContain('--ds-text-tiny');
    expect(source).toContain('legacy-bridge-present');
  });
});
