import { createFileRoute, redirect } from '@tanstack/react-router';

import { parseRewardsHistoryPageSearch } from '@/features/earn/rewards-history-page-display';
import { getSession } from '@/lib/auth';
import { RewardsHistoryPage } from '@/product/surfaces/rewards/rewards-history-page';

export const Route = createFileRoute('/rewards/history')({
  validateSearch: (search: Record<string, unknown>) => parseRewardsHistoryPageSearch(search),
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: RewardsHistoryPage,
});
