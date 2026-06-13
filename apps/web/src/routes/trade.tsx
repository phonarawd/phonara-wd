import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { PresentationRoot } from '../presentation-import/presentation-root';
import { ImportedTradePage } from '../presentation-import/pages/trade-page';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/trade',
  component: ImportedTradeRoute,
});

function ImportedTradeRoute() {
  return (
    <PresentationRoot>
      <ImportedTradePage />
    </PresentationRoot>
  );
}
