import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { ReferralPage } from '@/product/surfaces/referral/referral-page';

export const Route = createFileRoute('/referral')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: ReferralRoutePage,
});

function ReferralRoutePage() {
  return <ReferralPage />;
}
