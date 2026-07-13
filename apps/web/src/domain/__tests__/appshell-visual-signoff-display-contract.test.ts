import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  APPSHELL_CHROME_CHECKLIST,
  APPSHELL_CHROME_CSS_TOKENS,
  APPSHELL_DEAD_CONTROL_TEST_IDS,
  APPSHELL_VISUAL_HUB_ROUTES,
  APPSHELL_VISUAL_PREVIEW_DEPLOY_SCRIPT,
  APPSHELL_VISUAL_VIEWPORT_WIDTHS,
} from '../appshell-visual-signoff-display-contract';

describe('appshell-visual-signoff-display-contract §20.12', () => {
  it('defines 390/768/1024 viewport smoke widths', () => {
    expect(APPSHELL_VISUAL_VIEWPORT_WIDTHS).toEqual([390, 768, 1024]);
  });

  it('lists five-tab hub routes for sign-off', () => {
    expect(APPSHELL_VISUAL_HUB_ROUTES).toEqual([
      '/home',
      '/wallet',
      '/trade',
      '/sports',
      '/casino',
    ]);
  });

  it('exports §12.19.5 AppShell chrome checklist companions', () => {
    expect(APPSHELL_CHROME_CHECKLIST.length).toBeGreaterThanOrEqual(6);
    expect(APPSHELL_DEAD_CONTROL_TEST_IDS).toContain('bottom-nav');
    expect(APPSHELL_DEAD_CONTROL_TEST_IDS).toContain('app-topbar');
    expect(APPSHELL_CHROME_CSS_TOKENS.topbarHeight).toBe('--ds-shell-topbar-height');
  });

  it('points preview deploy at Cloudflare Pages web preview script', () => {
    expect(APPSHELL_VISUAL_PREVIEW_DEPLOY_SCRIPT).toBe('deploy:pages:web:preview');
  });

  it('shell-chrome.css encodes §12.19.5 height tokens and forbids TopBar blur', () => {
    const cssPath = resolve(import.meta.dirname, '../../product/shell/shell-chrome.css');
    const css = readFileSync(cssPath, 'utf8');

    expect(css).toContain(`${APPSHELL_CHROME_CSS_TOKENS.topbarHeight}: 56px`);
    expect(css).toContain(`${APPSHELL_CHROME_CSS_TOKENS.bottomnavHeight}: 56px`);
    expect(css).toContain(`${APPSHELL_CHROME_CSS_TOKENS.earnChipHeight}: 48px`);
    expect(css).toContain(`${APPSHELL_CHROME_CSS_TOKENS.sidenavExpanded}: 240px`);
    expect(css).toContain('scroll-snap-type: x mandatory');
    expect(css).toContain('width: 4px');
    expect(css).toContain('width: 24px');
    const topbarBlock = css.match(/\.ds-shell-topbar\s*\{[^}]*\}/)?.[0] ?? '';
    expect(topbarBlock.length).toBeGreaterThan(0);
    expect(topbarBlock).not.toContain('backdrop-filter');
  });
});
