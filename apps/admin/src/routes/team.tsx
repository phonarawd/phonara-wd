import { createFileRoute } from '@tanstack/react-router';

import { AdminTeamPage } from '@/product/surfaces/admin-team-page';

export const Route = createFileRoute('/team')({
  component: AdminTeamPage,
});
