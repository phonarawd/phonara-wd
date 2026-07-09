import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { HomeMissionsInvitePage } from '@/product/surfaces/home/home-missions-invite-page';

export const Route = createFileRoute('/home/missions/invite')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: HomeMissionsInvitePage,
});
