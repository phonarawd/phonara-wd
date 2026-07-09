import { createFileRoute } from '@tanstack/react-router';

import { AdminMfaPolicyPage } from '@/product/surfaces/admin-mfa-policy-page';

export const Route = createFileRoute('/mfa/policy')({
  component: AdminMfaPolicyPage,
});
