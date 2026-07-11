import { createFileRoute } from '@tanstack/react-router';
import { AdminTierBenefitsPage } from '@/product/surfaces/admin-tier-benefits-page';

export const Route = createFileRoute('/tier-benefits')({
  component: AdminTierBenefitsPage,
});
