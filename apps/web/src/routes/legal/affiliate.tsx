import { createFileRoute } from '@tanstack/react-router';

import { AffiliatePage } from '@/product/surfaces/legal/affiliate-page';

export const Route = createFileRoute('/legal/affiliate')({
  component: AffiliatePage,
});
