import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { StakingLovableSurface } from '../presentation-import/wallet/staking-lovable-surface';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/staking',
  component: StakingRoute,
});

function StakingRoute() {
  return <StakingLovableSurface />;
}
