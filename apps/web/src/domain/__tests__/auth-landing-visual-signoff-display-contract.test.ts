import { describe, expect, it } from 'vitest';

import {
  AUTH_LANDING_AUTH_CHECKLIST,
  AUTH_LANDING_DEAD_CONTROL_TEST_IDS,
  AUTH_LANDING_LANDING_CHECKLIST,
  AUTH_LANDING_VISUAL_PREVIEW_DEPLOY_SCRIPT,
  AUTH_LANDING_VISUAL_ROUTES,
  AUTH_LANDING_VISUAL_VIEWPORT_WIDTHS,
} from '../auth-landing-visual-signoff-display-contract';

describe('auth-landing-visual-signoff-display-contract §20.12', () => {
  it('defines 390/768/1024 viewport smoke widths', () => {
    expect(AUTH_LANDING_VISUAL_VIEWPORT_WIDTHS).toEqual([390, 768, 1024]);
  });

  it('lists landing and auth funnel routes for sign-off', () => {
    expect(AUTH_LANDING_VISUAL_ROUTES).toEqual([
      '/',
      '/login',
      '/signup',
      '/reset-password',
      '/verify-email',
    ]);
  });

  it('exports §22.2 Landing+Auth checklist companions', () => {
    expect(AUTH_LANDING_LANDING_CHECKLIST.length).toBeGreaterThanOrEqual(9);
    expect(AUTH_LANDING_LANDING_CHECKLIST).toContain('design-release-v1');
    expect(AUTH_LANDING_AUTH_CHECKLIST.length).toBeGreaterThanOrEqual(4);
    expect(AUTH_LANDING_DEAD_CONTROL_TEST_IDS).toContain('login-submit');
    expect(AUTH_LANDING_DEAD_CONTROL_TEST_IDS).toContain('signup-submit');
  });

  it('points preview deploy at Cloudflare Pages web preview script', () => {
    expect(AUTH_LANDING_VISUAL_PREVIEW_DEPLOY_SCRIPT).toBe('deploy:pages:web:preview');
  });
});
