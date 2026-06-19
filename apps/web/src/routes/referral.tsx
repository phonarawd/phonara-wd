import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { ReferralLovableSurface } from '../presentation-import/referral/referral-lovable-surface';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/referral',
  component: ReferralLovableSurface,
});
