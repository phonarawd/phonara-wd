import { describe, expect, it } from 'vitest';

import {
  assertP11EarnSideSurfacesSync,
  P11_EARN_SIDE_SURFACES_ROUTES,
  P11_EARN_SIDE_SURFACES_TODO,
} from '../earn-side-surfaces-display-contract';
import { P11_SIDE_INCOME_REGISTERED_ROUTES } from '@/product/shell/subnav-route-manifest';

describe('earn-side-surfaces-display-contract', () => {
  it('binds P11 todo and four routes', () => {
    expect(P11_EARN_SIDE_SURFACES_TODO).toBe('p11-earn-side-surfaces');
    expect([...P11_EARN_SIDE_SURFACES_ROUTES]).toEqual([...P11_SIDE_INCOME_REGISTERED_ROUTES]);
    expect(() => assertP11EarnSideSurfacesSync()).not.toThrow();
  });
});
