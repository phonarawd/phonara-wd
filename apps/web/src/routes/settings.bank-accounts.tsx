import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { BankAccountsSettingsPage } from '@/product/surfaces/settings/bank-accounts-settings-page';

export const Route = createFileRoute('/settings/bank-accounts')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: BankAccountsSettingsPage,
});
