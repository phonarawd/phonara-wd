import { createFileRoute } from '@tanstack/react-router';

import { AdminQueuesPage } from '@/product/surfaces/admin-queues-page';

export const Route = createFileRoute('/queues')({
  component: AdminQueuesPage,
});
