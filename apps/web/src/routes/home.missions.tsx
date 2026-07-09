import { createFileRoute, redirect } from '@tanstack/react-router';

import { parseHomeMissionsHubSearch } from '@/domain/home-missions-display-contract';
import { getSession } from '@/lib/auth';
import { HomeMissionsPage } from '@/product/surfaces/home/home-missions-page';

export const Route = createFileRoute('/home/missions')({
  validateSearch: (search: Record<string, unknown>) => parseHomeMissionsHubSearch(search),
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: HomeMissionsRoutePage,
});

function HomeMissionsRoutePage() {
  const search = Route.useSearch();
  return <HomeMissionsPage search={search} />;
}
