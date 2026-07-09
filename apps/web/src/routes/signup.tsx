import { createFileRoute } from '@tanstack/react-router';

import { SignupPage } from '@/product/surfaces/signup/signup-page';

type SignupSearch = {
  referral_code?: string;
  ref?: string;
};

export const Route = createFileRoute('/signup')({
  validateSearch: (search: Record<string, unknown>): SignupSearch => ({
    referral_code:
      typeof search['referral_code'] === 'string' ? search['referral_code'] : undefined,
    ref: typeof search['ref'] === 'string' ? search['ref'] : undefined,
  }),
  component: SignupRoute,
});

function SignupRoute() {
  const { referral_code: referralCode, ref: legacyRef } = Route.useSearch();
  return <SignupPage initialReferralCode={referralCode ?? legacyRef} />;
}
