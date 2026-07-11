import { createFileRoute } from '@tanstack/react-router';
import { AdminCasinoPage } from '@/product/surfaces/admin-casino-page';

export const Route = createFileRoute('/casino')({
  component: AdminCasinoPage,
});
