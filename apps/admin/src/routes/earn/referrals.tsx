import { createFileRoute } from '@tanstack/react-router';

import { AdminEarnReferralsPage } from '@/product/surfaces/admin-earn-referrals-page';

export const Route = createFileRoute('/earn/referrals')({
  component: AdminEarnReferralsPage,
});
