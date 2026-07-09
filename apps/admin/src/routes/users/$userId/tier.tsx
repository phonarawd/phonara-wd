import { createFileRoute } from '@tanstack/react-router';

import { AdminUserTierPage } from '@/product/surfaces/admin-user-tier-page';

export const Route = createFileRoute('/users/$userId/tier')({
  component: UserTierRoute,
});

function UserTierRoute() {
  const { userId } = Route.useParams();
  return <AdminUserTierPage userId={userId} />;
}
