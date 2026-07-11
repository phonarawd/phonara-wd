import { createRouter } from '@tanstack/react-router';

import { QuadStreamLoading } from '@/product/primitives/quad-stream-loading';

import { routeTree } from './routeTree.gen';

export const router = createRouter({
  routeTree,
  defaultPreload: import.meta.env.DEV ? false : 'intent',
  defaultPendingComponent: QuadStreamLoading,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
