import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { ReferralInvitePage } from '@/product/surfaces/referral/referral-invite-page';

export const Route = createFileRoute('/referral/invite')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: ReferralInviteRoutePage,
});

function ReferralInviteRoutePage() {
  return <ReferralInvitePage />;
}
