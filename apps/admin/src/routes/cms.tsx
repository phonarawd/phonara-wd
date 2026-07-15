import { createFileRoute } from '@tanstack/react-router';
import { AdminCmsPage } from '@/product/surfaces/admin-cms-page';

export const Route = createFileRoute('/cms')({
  component: AdminCmsPage,
});
