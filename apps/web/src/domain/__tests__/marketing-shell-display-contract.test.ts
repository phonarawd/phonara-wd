import { describe, expect, it } from 'vitest';

import {
  MARKETING_SHELL_ATTRIBUTION_ROUTES,
  MARKETING_SHELL_AUTH_ROUTES,
  MARKETING_SHELL_ZONE,
} from '@/domain/marketing-shell-display-contract';

describe('marketing-shell-display-contract', () => {
  it('defines standalone marketing zone outside AppShell', () => {
    expect(MARKETING_SHELL_ZONE).toBe('standalone');
  });

  it('lists auth funnel routes for marketing shell', () => {
    expect(MARKETING_SHELL_AUTH_ROUTES).toEqual([
      '/login',
      '/signup',
      '/reset-password',
      '/verify-email',
    ]);
  });

  it('limits ad attribution host to landing and signup/login only', () => {
    expect(MARKETING_SHELL_ATTRIBUTION_ROUTES).toEqual(['/', '/signup', '/login']);
  });
});
