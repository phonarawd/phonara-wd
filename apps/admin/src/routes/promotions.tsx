import { createFileRoute } from '@tanstack/react-router';
import { AdminPromotionsPage } from '@/product/surfaces/admin-promotions-page';

export const Route = createFileRoute('/promotions')({
  component: AdminPromotionsPage,
});
