import { createFileRoute } from '@tanstack/react-router';

import { AdminAuditPage } from '@/product/surfaces/admin-audit-page';

export const Route = createFileRoute('/audit')({
  component: AdminAuditPage,
});
