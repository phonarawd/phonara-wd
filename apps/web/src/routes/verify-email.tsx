import { createFileRoute } from '@tanstack/react-router';

import { VerifyEmailPage } from '@/product/surfaces/verify-email/verify-email-page';

type VerifyEmailSearch = {
  email?: string;
  sent?: string;
};

function parseStartSent(value: unknown): boolean {
  if (value === true || value === '1' || value === 'true') return true;
  return false;
}

export const Route = createFileRoute('/verify-email')({
  validateSearch: (search: Record<string, unknown>): VerifyEmailSearch => ({
    email: typeof search['email'] === 'string' ? search['email'] : undefined,
    sent: typeof search['sent'] === 'string' ? search['sent'] : undefined,
  }),
  component: VerifyEmailRoute,
});

function VerifyEmailRoute() {
  const { email, sent } = Route.useSearch();
  return <VerifyEmailPage initialEmail={email} startSent={parseStartSent(sent)} />;
}
