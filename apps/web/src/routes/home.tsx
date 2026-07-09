import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { EarnHomePage } from '@/product/surfaces/home/earn-home-page';

export const Route = createFileRoute('/home')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: HomeRoutePage,
});

function HomeRoutePage() {
  return <EarnHomePage />;
}
