import { createFileRoute } from '@tanstack/react-router';

import { TrustSecurityPage } from '@/product/surfaces/marketing/trust-security-page';

export const Route = createFileRoute('/security')({
  component: TrustSecurityPage,
});
