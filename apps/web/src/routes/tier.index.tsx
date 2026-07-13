import { createFileRoute } from '@tanstack/react-router';

import { TierGuidePage } from '@/product/surfaces/marketing/tier-guide-page';

export const Route = createFileRoute('/tier/')({
  component: TierGuidePage,
});
