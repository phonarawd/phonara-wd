import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { LedgerLovableSurface } from '../presentation-import/wallet/ledger-lovable-surface';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ledger',
  component: LedgerRoute,
});

function LedgerRoute() {
  return <LedgerLovableSurface />;
}
