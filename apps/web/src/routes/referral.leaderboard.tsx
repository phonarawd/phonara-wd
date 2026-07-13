import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { ReferralLeaderboardPage } from '@/product/surfaces/referral/referral-leaderboard-page';

export const Route = createFileRoute('/referral/leaderboard')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: ReferralLeaderboardPage,
});
