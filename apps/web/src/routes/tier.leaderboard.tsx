import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { TierLeaderboardPage } from '@/product/surfaces/tier/tier-leaderboard-page';

export const Route = createFileRoute('/tier/leaderboard')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: TierLeaderboardPage,
});
