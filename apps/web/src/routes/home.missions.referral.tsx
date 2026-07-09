import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { HomeMissionsReferralPage } from '@/product/surfaces/home/home-missions-referral-page';

export const Route = createFileRoute('/home/missions/referral')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: HomeMissionsReferralPage,
});
