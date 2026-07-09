import { useEffect } from 'react';
import { Gift, UserPlus, Wallet } from 'lucide-react';

import { useOnboardingPageController } from '@/features/onboarding/use-onboarding-page-controller';
import { BRAND_ASSETS } from '@/domain/brand-display-contract';
import { Button } from '@/product/primitives/button';
import { Card, CardBody } from '@/product/primitives/card';
import { ProgressRing } from '@/product/primitives/progress-ring';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';

const STEP_ICONS = [Gift, UserPlus, Wallet] as const;

/** Canonical `/onboarding` — post-auth 3-step funnel · Starter→Bronze tier handoff (ui_only). */
export function OnboardingPage() {
  const engine = useOnboardingPageController();
  const {
    t,
    loading,
    step,
    stepCount,
    steps,
    bronzeXpGoal,
    isFirstStep,
    isLastStep,
    goNext,
    goBack,
    skip,
  } = engine;
  const current = steps[step - 1];
  const StepIcon = STEP_ICONS[step - 1] ?? Gift;
  const progressValue = Math.round((step / stepCount) * 100);

  useEffect(() => {
    document.title = t('seo.onboarding.title');
  }, [t]);

  if (loading || !current) {
    return (
      <div
        className="mx-auto flex w-full max-w-lg flex-col gap-6 py-2"
        data-testid="onboarding-loading"
      >
        <Skeleton className="mx-auto size-20 rounded-(--ds-radius-lg)" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    );
  }

  return (
    <div
      className="mx-auto flex w-full max-w-lg flex-col gap-6 py-2 md:py-4"
      data-testid="onboarding-page"
    >
      <header className="flex flex-col items-center gap-4 text-center">
        <img
          src={BRAND_ASSETS.raster}
          alt=""
          className="size-20"
          width={80}
          height={80}
          aria-hidden
        />
        <div className="flex flex-col gap-2">
          <h1 className="text-foreground m-0 text-2xl font-semibold">
            {t('onboarding.flow.pageTitle')}
          </h1>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {t('onboarding.flow.subtitle')}
          </p>
        </div>
      </header>

      <Card data-testid="onboarding-tier-card">
        <CardBody className="flex items-center gap-4">
          <ProgressRing
            value={progressValue}
            size={56}
            tone="accent"
            aria-label={t('onboarding.tier.progressHint')}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1 text-left">
            <p className="text-accent m-0 text-xs font-semibold tracking-wide uppercase">
              {t('onboarding.tier.eyebrow')}
            </p>
            <p className="text-foreground m-0 text-base font-semibold">
              {t('onboarding.tier.starterLabel')}
            </p>
            <p className="text-foreground-muted m-0 text-sm leading-relaxed">
              {t('onboarding.tier.starterDesc')}
            </p>
            <p className="text-foreground-muted m-0 text-xs">
              <span className="text-foreground font-medium">
                {t('onboarding.tier.nextLabel')}:{' '}
              </span>
              <span className="tabular-nums">
                {t('onboarding.tier.bronzeGoal', { xp: bronzeXpGoal.toLocaleString() })}
              </span>
            </p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-foreground-muted m-0 text-sm tabular-nums">
              {t('onboarding.flow.progress', { current: step, total: stepCount })}
            </p>
            <div className="flex items-center gap-1.5" aria-hidden>
              {steps.map((item, index) => (
                <span
                  key={item.titleKey}
                  className={cn(
                    'bg-surface-raised h-1.5 w-8 rounded-full transition-colors duration-(--ds-motion-surface)',
                    index + 1 <= step && 'bg-accent',
                  )}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 text-center md:text-left">
            <span className="bg-accent/10 text-accent mx-auto flex size-12 items-center justify-center rounded-(--ds-radius-md) md:mx-0">
              <StepIcon className="size-6" aria-hidden />
            </span>
            <h2
              className="text-foreground m-0 text-xl font-semibold"
              data-testid="onboarding-step-title"
            >
              {t(current.titleKey)}
            </h2>
            <p
              className="text-foreground-muted m-0 text-sm leading-relaxed"
              data-testid="onboarding-step-desc"
            >
              {t(current.descKey)}
            </p>
          </div>
        </CardBody>
      </Card>

      <div className="flex flex-col gap-3">
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="w-full"
          data-testid="onboarding-primary-cta"
          onClick={goNext}
        >
          {isLastStep ? t('onboarding.flow.finish') : t('onboarding.flow.next')}
        </Button>

        <div className={cn('grid gap-2', isFirstStep ? 'grid-cols-1' : 'grid-cols-2')}>
          {!isFirstStep ? (
            <Button
              type="button"
              variant="outline"
              size="md"
              className="w-full"
              data-testid="onboarding-back"
              onClick={goBack}
            >
              {t('onboarding.flow.back')}
            </Button>
          ) : null}
          <button
            type="button"
            className={cn(
              'text-foreground-muted hover:text-foreground text-sm underline-offset-4 transition-colors hover:underline',
              isFirstStep && 'text-center',
            )}
            data-testid="onboarding-skip"
            onClick={skip}
          >
            {t('onboarding.flow.skip')}
          </button>
        </div>
      </div>
    </div>
  );
}
