import { LANDING_WALLET_PREVIEW_PHON } from '@/domain/landing-display-contract';
import { landingAnalyticsEventAttr } from '@/domain/landing-analytics-display-contract';
import { useEarnFiatHint } from '@/features/earn/use-earn-fiat-hint';
import { LandingAnalyticsSection } from '@/features/landing/landing-analytics-section';
import { useT } from '@/product/i18n';
import { buttonVariants } from '@/product/primitives/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/product/primitives/card';
import { cn } from '@/product/primitives/lib/cn';
import { MoneyDisplay } from '@/product/primitives/money-display';
import { FiatHintSecondaryLine } from '@/product/primitives/money-display-with-fiat-hint';

export type LandingWalletPreviewProps = {
  signupHref: string;
  className?: string;
};

/**
 * Presentation wallet card — PHON Decimal string + fresh FiatHint only (H-01).
 * Missing/stale rate → omit KRW line · never invent 1 PHON = 1 KRW.
 */
export function LandingWalletPreview({ signupHref, className }: LandingWalletPreviewProps) {
  const t = useT();
  const earnFiat = useEarnFiatHint(true);
  const fiatHint = earnFiat.hintFor(LANDING_WALLET_PREVIEW_PHON, 'PHON');
  const showFiatHint = !fiatHint.disabled && fiatHint.formattedHint !== '—';

  return (
    <LandingAnalyticsSection
      event="landing.wallet.viewed"
      className={cn('flex flex-col gap-3', className)}
      testId="landing-wallet-preview"
    >
      <Card className="border-accent/20 bg-surface-raised">
        <CardHeader className="pb-0">
          <CardTitle className="text-base">{t('landing.wallet.title')}</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-4 pt-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-foreground-muted text-xs font-medium">
                {t('landing.wallet.balanceLabel')}
              </span>
              <MoneyDisplay
                amount={LANDING_WALLET_PREVIEW_PHON}
                currency="PHON"
                showCurrency
                size="hero"
                className="text-foreground text-3xl font-semibold"
              />
            </div>
            {showFiatHint ? (
              <FiatHintSecondaryLine fiatHint={fiatHint} hintLayout="secondary" />
            ) : null}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-foreground-muted m-0 text-xs">{t('landing.wallet.withdrawHint')}</p>
            <a
              href={signupHref}
              className={cn(buttonVariants({ variant: 'ghost', size: 'md' }), 'shrink-0 px-3')}
              data-testid="landing-wallet-withdraw-cta"
              {...landingAnalyticsEventAttr('landing.signup.started')}
            >
              {t('landing.wallet.withdrawCta')}
            </a>
          </div>
        </CardBody>
      </Card>
    </LandingAnalyticsSection>
  );
}
