import { createFileRoute, redirect } from '@tanstack/react-router';

import { hasAccountMarker } from '@/lib/auth-account-marker';
import { getSessionWithTimeout } from '@/lib/auth';
import { resolveLandingRouteRedirect } from '@/lib/landing-route-guard';
import { LandingPage } from '@/product/surfaces/landing/landing-page';

export const Route = createFileRoute('/')({
  beforeLoad: async ({ location }) => {
    const session = await getSessionWithTimeout();
    const target = resolveLandingRouteRedirect({
      search: location.searchStr,
      hasSession: Boolean(session),
      hasAccount: hasAccountMarker(),
    });
    if (target) {
      throw redirect({ href: target, replace: true });
    }
  },
  component: LandingPage,
});
