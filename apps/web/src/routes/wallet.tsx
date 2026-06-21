import { createRoute } from '@tanstack/react-router';

import { Route as rootRoute } from './__root';

import { WalletLovableSurface } from '../presentation-import/wallet/wallet-lovable-surface';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/wallet',
  component: WalletRoute,
});

function WalletRoute() {
  return <WalletLovableSurface />;
}


