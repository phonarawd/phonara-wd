import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { TierBenefitsPage } from '@/product/surfaces/tier/tier-benefits-page';

export const Route = createFileRoute('/tier/benefits')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: TierBenefitsPage,
});
