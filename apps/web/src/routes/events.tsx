import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { EventsHubPage } from '@/product/surfaces/events/events-hub-page';

export const Route = createFileRoute('/events')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: EventsHubPage,
});
