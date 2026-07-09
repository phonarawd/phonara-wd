import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  P8_CORE_DEAD_CONTROL_TEST_IDS,
  P8_CORE_HUB_CHECKLIST,
  P8_CORE_VISUAL_PREVIEW_DEPLOY_SCRIPT,
  P8_CORE_VISUAL_PREVIEW_URL,
  P8_CORE_VISUAL_ROUTES,
  P8_CORE_VISUAL_VIEWPORT_WIDTHS,
  P8_EARN_HOME_CHECKLIST,
} from '../p8-core-visual-signoff-display-contract';
import { P8_CORE_REGISTERED_ROUTES } from '../../product/shell/subnav-route-manifest';

describe('p8-core-visual-signoff-display-contract §20.12', () => {
  it('defines 390/768/1024 viewport smoke widths', () => {
    expect(P8_CORE_VISUAL_VIEWPORT_WIDTHS).toEqual([390, 768, 1024]);
  });

  it('lists /home plus all P8 manifest routes for sign-off', () => {
    expect(P8_CORE_VISUAL_ROUTES).toEqual(['/home', ...P8_CORE_REGISTERED_ROUTES]);
    expect(P8_CORE_VISUAL_ROUTES).toHaveLength(12);
  });

  it('exports §22.2 Earn+Home and Core hub checklist companions', () => {
    expect(P8_EARN_HOME_CHECKLIST.length).toBeGreaterThanOrEqual(7);
    expect(P8_EARN_HOME_CHECKLIST).toContain('next-action-border-accent');
    expect(P8_CORE_HUB_CHECKLIST.length).toBeGreaterThanOrEqual(6);
    expect(P8_CORE_HUB_CHECKLIST).toContain('notifications-prefs-owner-separated');
    expect(P8_CORE_DEAD_CONTROL_TEST_IDS).toContain('earn-home-next-action-cta');
    expect(P8_CORE_DEAD_CONTROL_TEST_IDS).toContain('account-profile-save');
  });

  it('points preview deploy at Cloudflare Pages web preview script', () => {
    expect(P8_CORE_VISUAL_PREVIEW_DEPLOY_SCRIPT).toBe('deploy:pages:web:preview');
    expect(P8_CORE_VISUAL_PREVIEW_URL).toMatch(/^https:\/\/preview\./);
  });

  it('earn-home-page encodes §25.12.8 next-action accent highlight and semantic tokens', () => {
    const pagePath = resolve(import.meta.dirname, '../../product/surfaces/home/earn-home-page.tsx');
    const source = readFileSync(pagePath, 'utf8');

    expect(source).toContain('data-testid="earn-home-next-action"');
    expect(source).toContain('className="border-accent"');
    expect(source).toContain('data-testid="earn-home-mission-grid"');
    expect(source).toContain('MissionCard');
    expect(source).toContain('ProgressRing');
    expect(source).not.toMatch(/\btext-primary\b/);
    expect(source).not.toMatch(/\bbg-primary\b/);
    expect(source).not.toMatch(/\btext-muted-foreground\b/);
  });
});
