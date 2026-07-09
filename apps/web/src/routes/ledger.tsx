import { createFileRoute, redirect } from '@tanstack/react-router';

import { parseLedgerPageSearch } from '@/features/wallet/ledger-page-display';
import { getSession } from '@/lib/auth';
import { LedgerPage } from '@/product/surfaces/wallet/ledger-page';

export const Route = createFileRoute('/ledger')({
  validateSearch: (search: Record<string, unknown>) => parseLedgerPageSearch(search),
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: LedgerPage,
});
