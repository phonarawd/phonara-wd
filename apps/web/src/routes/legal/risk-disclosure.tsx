import { createFileRoute } from '@tanstack/react-router';

import { RiskDisclosurePage } from '@/product/surfaces/legal/risk-disclosure-page';

export const Route = createFileRoute('/legal/risk-disclosure')({
  component: RiskDisclosurePage,
});
