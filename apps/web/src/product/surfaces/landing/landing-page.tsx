import { Fragment, useEffect, useMemo, useRef, type ReactNode } from 'react';

import { useSearch } from '@tanstack/react-router';

import {
  parseLandingAbVariant,
  resolveLandingAbBrandLineKey,
  resolveLandingAbCtaKey,
  resolveLandingAbIaFoldOrder,
  type LandingAbIaFoldSectionId,
} from '@/domain/landing-ab-display-contract';

import { landingAnalyticsEventAttr } from '@/domain/landing-analytics-display-contract';

import {
  buildLandingSignupHref,
  formatLandingPhonAmount,
  LANDING_MISSION_TEASERS,
  LANDING_TESTIMONIAL_POOL,
  sumLandingAvailableRewardsPhon,
} from '@/domain/landing-display-contract';

import {
  PLATFORM_PILLAR_CONTENT,
  PLATFORM_PILLAR_IDS,
  PLATFORM_PILLARS_SECTION_SUBTITLE_KEY,
  PLATFORM_PILLARS_SECTION_TITLE_KEY,
  PLATFORM_POSITIONING_KEYS,
} from '@/domain/platform-narrative-display-contract';

import { useLandingLiveProof } from '@/features/landing/use-landing-live-proof';

import { useLandingPageAnalytics } from '@/features/landing/use-landing-analytics';

import { LandingAnalyticsSection } from '@/features/landing/landing-analytics-section';

import { useT } from '@/product/i18n';

import { BrandMark, BrandWordmark } from '@/product/primitives/brand-mark';

import { buttonVariants } from '@/product/primitives/button';

import { Card, CardBody, CardHeader, CardTitle } from '@/product/primitives/card';

import { cn } from '@/product/primitives/lib/cn';

import { LandingCumulativeStats } from './landing-cumulative-stats';

import { LandingDifferentiators } from './landing-differentiators';

import { LandingFaqSection } from './landing-faq-section';

import { LandingFinalCta } from './landing-final-cta';

import { LandingFooter } from './landing-footer';

import { LandingMissionPreviewRow } from './landing-mission-preview-row';

import { LandingTestimonials } from './landing-testimonials';

import { LandingWalletPreview } from './landing-wallet-preview';

import { LandingSignupMomentum } from './landing-signup-momentum';

import { LandingWhyStrip } from './landing-why-strip';

import { LandingWithdrawalMomentum } from './landing-withdrawal-momentum';

import { LandingWithdrawalProof } from './landing-withdrawal-proof';

import { LiveActivityTicker } from './live-activity-ticker';

function LandingSignupLink({
  href,

  className,

  testId,

  children,
}: {
  href: string;

  className?: string;

  testId?: string;

  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className={className}
      data-testid={testId}
      {...landingAnalyticsEventAttr('landing.signup.started')}
    >
      {children}
    </a>
  );
}

/** Canonical `/` campaign landing — §28 side-hustle · CVR-first IA · cold-start proof. */

export function LandingPage() {
  const t = useT();

  const pageRef = useRef<HTMLDivElement>(null);

  const search = useSearch({ strict: false }) as Record<string, string | undefined>;

  const abVariant = useMemo(() => parseLandingAbVariant(search), [search]);

  const foldOrder = useMemo(() => resolveLandingAbIaFoldOrder(abVariant), [abVariant]);

  const brandLineKey = resolveLandingAbBrandLineKey(abVariant);

  const ctaKey = resolveLandingAbCtaKey(abVariant);

  const signupHref = useMemo(() => {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(search)) {
      if (value) params.set(key, value);
    }

    return buildLandingSignupHref(params);
  }, [search]);

  const { proof, withdrawalMomentumCount } = useLandingLiveProof();

  const availableRewards = sumLandingAvailableRewardsPhon();

  const activeMissionCount = LANDING_MISSION_TEASERS.length;

  const visibleTestimonials = proof.testimonials === 'hidden' ? [] : LANDING_TESTIMONIAL_POOL;

  useLandingPageAnalytics(pageRef);

  useEffect(() => {
    document.title = t(PLATFORM_POSITIONING_KEYS.pageTitle);
  }, [t]);

  const foldSections: Record<LandingAbIaFoldSectionId, ReactNode> = {
    why: <LandingWhyStrip key="why" />,

    differentiators: <LandingDifferentiators key="differentiators" />,

    missionPreview: (
      <LandingAnalyticsSection
        as="div"
        event="landing.mission.viewed"
        testId="landing-mission-preview-analytics"
      >
        <LandingMissionPreviewRow signupHref={signupHref} />
      </LandingAnalyticsSection>
    ),

    walletPreview: <LandingWalletPreview key="walletPreview" signupHref={signupHref} />,
  };

  return (
    <div
      ref={pageRef}
      className="flex w-full flex-col gap-16 py-6 md:gap-20 md:py-10"
      data-testid="landing-page"
      data-landing-ab-variant={abVariant}
    >
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <BrandMark size={24} className="text-accent" testId="landing-header-brand-mark" />

          <BrandWordmark className="text-foreground text-lg" testId="landing-header-wordmark" />
        </div>

        <a
          href="/login"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
          data-testid="landing-header-login"
        >
          {t('landing.header.login')}
        </a>
      </header>

      <LandingAnalyticsSection
        event="landing.hero.viewed"
        testId="landing-hero"
        className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-12"
      >
        <div className="flex flex-1 flex-col gap-4">
          <p className="text-foreground-muted m-0 text-sm font-medium">
            {t(PLATFORM_POSITIONING_KEYS.eyebrow)}
          </p>

          <h1 className="text-foreground font-display text-balance m-0 text-3xl font-bold tracking-tight break-keep md:text-4xl">
            {t(brandLineKey)}
          </h1>

          <p className="text-foreground-muted m-0 text-base leading-relaxed">
            {t(PLATFORM_POSITIONING_KEYS.subhead)}
          </p>

          <LandingSignupLink
            href={signupHref}
            className={cn(buttonVariants({ variant: 'primary', size: 'lg' }), 'w-full md:w-auto')}
            testId="landing-hero-cta"
          >
            <span {...landingAnalyticsEventAttr('landing.hero.cta')}>{t(ctaKey)}</span>
          </LandingSignupLink>

          <p className="text-foreground-muted m-0 text-sm">{t('landing.hero.ctaHint')}</p>
        </div>

        <BrandMark
          variant={abVariant === 'b' ? 'aurora' : 'hero-3d'}
          className="mx-auto w-full max-w-sm"
          testId="landing-hero-brand"
        />
      </LandingAnalyticsSection>

      {foldOrder.map((sectionId) => (
        <Fragment key={sectionId}>{foldSections[sectionId]}</Fragment>
      ))}

      {proof.stats !== 'hidden' ? <LandingCumulativeStats /> : null}

      <section className="flex flex-col gap-6" data-testid="landing-proof">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-base">
                {t('landing.proof.availableRewardsLabel')}
              </CardTitle>
            </CardHeader>

            <CardBody>
              <p className="text-accent m-0 text-2xl font-semibold tabular-nums">
                {t('landing.proof.availableRewardsValue', {
                  amount: formatLandingPhonAmount(availableRewards),
                })}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-base">{t('landing.proof.activeMissionsLabel')}</CardTitle>
            </CardHeader>

            <CardBody>
              <p className="text-foreground m-0 text-2xl font-semibold tabular-nums">
                {t('landing.proof.activeMissionsValue', { count: String(activeMissionCount) })}
              </p>
            </CardBody>
          </Card>
        </div>

        {proof.withdrawalMomentum === 'live' ? (
          <LandingWithdrawalMomentum
            count={withdrawalMomentumCount}
            className="border-line bg-surface-raised rounded-lg border px-4 py-3"
          />
        ) : (
          <LandingSignupMomentum className="border-line bg-surface-raised rounded-lg border px-4 py-3" />
        )}

        <LiveActivityTicker className="border-line bg-surface rounded-lg border px-4 py-3" />
      </section>

      <section className="flex flex-col gap-6" data-testid="landing-how">
        <div className="flex flex-col gap-2">
          <h2 className="text-foreground m-0 text-2xl font-semibold">
            {t(PLATFORM_PILLARS_SECTION_TITLE_KEY)}
          </h2>

          <p className="text-foreground-muted m-0 text-sm">
            {t(PLATFORM_PILLARS_SECTION_SUBTITLE_KEY)}
          </p>
        </div>

        <ol className="m-0 grid list-none gap-4 p-0 md:grid-cols-3">
          {PLATFORM_PILLAR_IDS.map((pillarId) => {
            const pillar = PLATFORM_PILLAR_CONTENT[pillarId];

            return (
              <li key={pillarId} className="border-line bg-surface rounded-lg border p-4">
                <p className="text-foreground m-0 font-semibold">{t(pillar.titleKey)}</p>

                <p className="text-foreground-muted m-0 mt-2 text-sm">{t(pillar.descKey)}</p>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="flex flex-col gap-6" data-testid="landing-missions">
        <div className="flex flex-col gap-2">
          <h2 className="text-foreground m-0 text-2xl font-semibold">
            {t('landing.missions.title')}
          </h2>

          <p className="text-foreground-muted m-0 text-sm">{t('landing.missions.subtitle')}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {LANDING_MISSION_TEASERS.map((mission) => (
            <Card key={mission.id}>
              <CardHeader className="pb-0">
                <CardTitle className="text-base">{t(mission.titleKey)}</CardTitle>
              </CardHeader>

              <CardBody className="flex flex-col gap-2 pt-3">
                <p className="text-accent m-0 text-lg font-semibold tabular-nums">
                  {mission.rewardLabel}
                </p>

                <p className="text-foreground-muted m-0 text-xs">{t(mission.eligibilityKey)}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <LandingWithdrawalProof />

      {visibleTestimonials.length > 0 ? (
        <LandingTestimonials entries={visibleTestimonials} />
      ) : null}

      <section className="flex flex-col gap-4" data-testid="landing-trust">
        <h2 className="text-foreground m-0 text-2xl font-semibold">{t('landing.trust.title')}</h2>

        <ul className="text-foreground-muted m-0 flex list-none flex-col gap-3 p-0 text-sm">
          <li>{t('landing.trust.passkey')}</li>

          <li>
            {t('landing.trust.fairBefore')}

            <a
              href="/legal/risk-disclosure"
              className="text-accent underline-offset-4 hover:underline"
            >
              {t('landing.trust.fairLink')}
            </a>

            {t('landing.trust.fairAfter')}
          </li>

          <li>{t('landing.trust.withdraw')}</li>

          <li>{t('landing.trust.business')}</li>
        </ul>
      </section>

      <LandingFaqSection />

      <LandingFinalCta signupHref={signupHref} SignupLink={LandingSignupLink} />

      <LandingFooter />
    </div>
  );
}
