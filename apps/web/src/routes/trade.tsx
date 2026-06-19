import { createRoute } from '@tanstack/react-router';

import { Route as rootRoute } from './__root';

import { TradeLovableSurface } from '../presentation-import/trading/trade-lovable-surface';



export const Route = createRoute({

  getParentRoute: () => rootRoute,

  path: '/trade',

  component: TradeLovableSurface,

});

