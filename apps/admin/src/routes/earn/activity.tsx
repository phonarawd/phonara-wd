import { createFileRoute } from '@tanstack/react-router';
import { AdminEarnActivityPage } from '@/product/surfaces/admin-earn-activity-page';

export const Route = createFileRoute('/earn/activity')({
  component: AdminEarnActivityPage,
});
