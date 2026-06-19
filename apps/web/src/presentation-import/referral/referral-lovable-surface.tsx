import { PresentationRoot } from '../presentation-root';
import { ImportedReferralPage } from '../pages/referral-page';
import { useReferralPageController } from '../../features/referral/use-referral-page-controller';

/** L2 Wave C — /referral route body. */
export function ReferralLovableSurface() {
  const { authLoading, pageLoading, viewProps } = useReferralPageController();

  if (authLoading || pageLoading) {
    return (
      <PresentationRoot>
        <div className="flex min-h-dvh items-center justify-center" aria-busy="true" data-testid="referral-loading">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      </PresentationRoot>
    );
  }

  return (
    <PresentationRoot>
      <ImportedReferralPage {...viewProps} />
    </PresentationRoot>
  );
}
