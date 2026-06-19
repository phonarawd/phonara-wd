import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import {
  EarnHomeLovableSurface,
  EarnLayoutLovableSurface,
  EarnMissionsLovableSurface,
} from '../presentation-import/earn/earn-lovable-surface';

/** /earn layout — tab nav + Outlet (Lovable ImportedEarnPage). */
export const earnLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/earn',
  component: EarnLayoutLovableSurface,
});

export const earnIndexRoute = createRoute({
  getParentRoute: () => earnLayoutRoute,
  path: '/',
  component: EarnHomeLovableSurface,
});

export const earnMissionsRoute = createRoute({
  getParentRoute: () => earnLayoutRoute,
  path: '/missions',
  component: EarnMissionsLovableSurface,
});

/** @deprecated Use earnLayoutRoute — kept for router import compatibility during paste. */
export const Route = earnLayoutRoute;
