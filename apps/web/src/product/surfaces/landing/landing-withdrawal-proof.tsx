import {
  LANDING_WITHDRAWAL_PROOF_IDS,
  landingWithdrawalProofLineKey,
} from '@/domain/landing-display-contract';
import { LandingAnalyticsSection } from '@/features/landing/landing-analytics-section';
import { useT } from '@/product/i18n';
import { Card, CardBody, CardHeader, CardTitle } from '@/product/primitives/card';
import { cn } from '@/product/primitives/lib/cn';

export type LandingWithdrawalProofProps = {
  className?: string;
};

/** Presentation withdrawal evidence — masked nicks · policy-safe copy (CVR §4). */
export function LandingWithdrawalProof({ className }: LandingWithdrawalProofProps) {
  const t = useT();

  return (
    <LandingAnalyticsSection
      event="landing.withdraw.viewed"
      className={cn('flex flex-col gap-4', className)}
      testId="landing-withdrawal-proof"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-foreground m-0 text-xl font-semibold">
          {t('landing.withdrawalProof.title')}
        </h2>
        <p className="text-foreground-muted m-0 text-sm">{t('landing.withdrawalProof.subtitle')}</p>
      </div>
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-sm font-medium">
            {t('landing.withdrawalProof.listAria')}
          </CardTitle>
        </CardHeader>
        <CardBody className="pt-3">
          <ul
            className="m-0 flex list-none flex-col gap-3 p-0 text-sm"
            aria-label={t('landing.withdrawalProof.listAria')}
          >
            {LANDING_WITHDRAWAL_PROOF_IDS.map((rowId) => (
              <li key={rowId} className="text-foreground-muted tabular-nums">
                {t(landingWithdrawalProofLineKey(rowId))}
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </LandingAnalyticsSection>
  );
}
