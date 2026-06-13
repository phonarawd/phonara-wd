import { Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import {
  AnimatedNumber,
  Badge,
  Icon,
  Progress,
  buttonVariants,
  type IconName,
} from '@phonara/ui';
import type { MessageKey } from '@phonara/i18n';
import { useT } from '../../lib/i18n';

type RewardStep = {
  id: 'attendance' | 'mission' | 'referral';
  titleKey: MessageKey;
  descriptionKey: MessageKey;
  amount: string;
  runningTotal: string;
  icon: IconName;
};

const REWARD_STEPS: RewardStep[] = [
  {
    id: 'attendance',
    titleKey: 'landing.rewardLoop.attendance.title',
    descriptionKey: 'landing.rewardLoop.attendance.description',
    amount: '1000',
    runningTotal: '1000',
    icon: 'check',
  },
  {
    id: 'mission',
    titleKey: 'landing.rewardLoop.mission.title',
    descriptionKey: 'landing.rewardLoop.mission.description',
    amount: '500',
    runningTotal: '1500',
    icon: 'earn',
  },
  {
    id: 'referral',
    titleKey: 'landing.rewardLoop.referral.title',
    descriptionKey: 'landing.rewardLoop.referral.description',
    amount: '10000',
    runningTotal: '11500',
    icon: 'user',
  },
];

function formatRewardAmount(value: string, unit: 'krw' | 'point' = 'point') {
  const grouped = value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return unit === 'krw' ? `₩${grouped}` : `${grouped}P`;
}

export function RewardLoopHero() {
  const t = useT();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setActiveIndex(REWARD_STEPS.length - 1);
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % REWARD_STEPS.length);
    }, 1400);

    return () => window.clearInterval(timer);
  }, []);

  const activeStep = REWARD_STEPS[activeIndex] ?? REWARD_STEPS[0]!;
  const progressValue = useMemo(() => ((activeIndex + 1) / REWARD_STEPS.length) * 100, [activeIndex]);

  return (
    <section className="landing-hero auth-stagger auth-stagger-1 flex flex-1 flex-col justify-center">
      <div className="mx-auto flex w-full max-w-136 flex-col items-center text-center">
        <div className="auth-live-badge mb-5">
          <span className="auth-live-dot" aria-hidden="true" />
          <Icon name="activity" size="xs" aria-hidden="true" />
          <span>{t('landing.heroReward.badge')}</span>
        </div>

        <h1 className="auth-headline max-w-[13ch] text-(length:--text-title) font-medium leading-title tracking-(--tracking-title) sm:text-(length:--text-display)">
          {t('landing.heroReward.headlineBefore')}{' '}
          <span className="auth-headline-phon bg-clip-text text-transparent">
            {formatRewardAmount('1000', 'krw')}
          </span>{' '}
          {t('landing.heroReward.headlineAfter')}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-(length:--text-body) leading-relaxed text-muted">
          {t('landing.heroReward.sub')}
        </p>

        <div
          className="mt-7 w-full rounded-4xl border border-primary/20 bg-surface/86 p-3 text-left shadow-[var(--elevation-2),var(--primary-glow)] backdrop-blur-xl"
          aria-label={t('landing.rewardLoop.ariaLabel')}
        >
          <div className="rounded-[1.55rem] border border-border/70 bg-surface-2/72 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-muted">{t('landing.rewardLoop.label')}</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <AnimatedNumber
                    value={activeStep.runningTotal}
                    format={(value) => formatRewardAmount(value)}
                    tone="primary"
                    emphasis="hero"
                  />
                  <span className="text-xs font-medium text-muted">{t('landing.rewardLoop.pending')}</span>
                </div>
              </div>
              <Badge tone="warning" className="shrink-0">
                {t('landing.heroReward.limitedBadge')}
              </Badge>
            </div>

            <div className="mt-4">
              <Progress value={progressValue} tone="up" label={t('landing.rewardLoop.progressLabel')} />
            </div>

            <ol className="mt-4 grid gap-2">
              {REWARD_STEPS.map((step, index) => {
                const isActive = index === activeIndex;
                const isComplete = index < activeIndex;
                return (
                  <li
                    key={step.id}
                    className={[
                      'flex min-h-14 items-center gap-3 rounded-2xl border px-3 py-2 transition-[background,border-color,transform] duration-(--motion-duration-2) ease-(--motion-ease-standard)',
                      isActive
                        ? 'border-primary/45 bg-primary/12 shadow-(--primary-glow)'
                        : isComplete
                          ? 'border-up/30 bg-up/8'
                          : 'border-border/70 bg-surface/70',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border',
                        isActive
                          ? 'border-primary/45 bg-primary/16 text-primary'
                          : isComplete
                            ? 'border-up/35 bg-up/12 text-up'
                            : 'border-border bg-surface-2 text-muted',
                      ].join(' ')}
                      aria-hidden="true"
                    >
                      <Icon name={step.icon} size="sm" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-fg">{t(step.titleKey)}</span>
                      <span className="mt-0.5 block text-xs leading-5 text-muted">{t(step.descriptionKey)}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-up/12 px-2.5 py-1 text-sm font-medium tabular-nums text-up">
                      +{formatRewardAmount(step.amount)}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-2xl border border-warning/24 bg-warning/10 p-3">
              <p className="text-xs font-medium text-warning">{t('landing.heroReward.slotLabel')}</p>
              <p className="mt-1 text-sm font-medium text-fg">{t('landing.heroReward.slotValue')}</p>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3">
              <p className="text-xs font-medium text-primary">{t('landing.heroReward.nextActionLabel')}</p>
              <p className="mt-1 text-sm font-medium text-fg">{t('landing.heroReward.nextActionValue')}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex w-full flex-col gap-3">
          <Link
            to="/signup"
            className={buttonVariants({ variant: 'primary', size: 'lg', full: true })}
          >
            {t('landing.heroReward.cta.primary')}
          </Link>
          <Link
            to="/login"
            className={buttonVariants({ variant: 'secondary', size: 'lg', full: true })}
          >
            {t('landing.heroReward.cta.secondary')}
          </Link>
        </div>
      </div>
    </section>
  );
}
