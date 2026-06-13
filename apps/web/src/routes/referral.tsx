import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { PresentationRoot } from '../presentation-import/presentation-root';
import { ImportedReferralPage } from '../presentation-import/pages/referral-page';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/referral',
  component: ImportedReferralRoute,
});

function ImportedReferralRoute() {
  return (
    <PresentationRoot>
      <ImportedReferralPage />
    </PresentationRoot>
  );
}
