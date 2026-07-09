import { useEffect } from 'react';

import { useHomeAttendancePageController } from '@/features/earn/use-home-attendance-page-controller';
import { Button } from '@/product/primitives/button';
import { Card, CardBody } from '@/product/primitives/card';
import { RoutineCard } from '@/product/primitives/routine-card';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';

/** Canonical `/home/attendance` — streak cycle · `rpc_claim_daily_reward` · §13.10 RoutineCard. */
export function HomeAttendancePage() {
  const engine = useHomeAttendancePageController();
  const {
    t,
    loading,
    error,
    streak,
    cycleDays,
    routineSteps,
    todayRewardLabel,
    nextRewardLabel,
    totalEarnedLabel,
    claimState,
    claiming,
    showStreakMilestone,
    claimAttendance,
  } = engine;

  useEffect(() => {
    document.title = t('earn.attendance.head.title');
  }, [t]);

  if (loading) {
    return (
      <div
        className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-4"
        data-testid="home-attendance-loading"
      >
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div
      className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-4 md:py-6"
      data-testid="home-attendance-page"
    >
      <header className="flex flex-col gap-2">
        <p className="text-accent m-0 text-xs font-semibold tracking-wide uppercase">
          {t('earn.attendance.eyebrow')}
        </p>
        <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
          {t('earn.attendance.title')}
        </h1>
        <p className="text-foreground-muted m-0 text-sm leading-relaxed">
          {t('earn.attendance.head.desc')}
        </p>
        {streak && streak.currentStreak > 0 ? (
          <p className="text-accent m-0 text-sm font-semibold tabular-nums">
            {t('earn.attendance.streakActive', { n: streak.currentStreak })}
          </p>
        ) : null}
      </header>

      <Card data-testid="home-attendance-reward-card">
        <CardBody className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-foreground-muted m-0 text-xs">
                {t('earn.attendance.todayReward')}
              </p>
              <p
                className="text-foreground m-0 text-2xl font-semibold tabular-nums"
                data-testid="home-attendance-today-reward"
              >
                {todayRewardLabel}
              </p>
            </div>
            {streak ? (
              <div className="text-right">
                <p className="text-foreground-muted m-0 text-xs">{t('daily.longestStreakLabel')}</p>
                <p className="text-foreground m-0 text-sm font-medium tabular-nums">
                  {t('daily.daysValue', { days: streak.longestStreak })}
                </p>
              </div>
            ) : null}
          </div>

          {claimState === 'completed' ? (
            <p className="text-foreground-muted m-0 text-sm tabular-nums">
              {t('daily.doneToday', {
                amount: nextRewardLabel.endsWith('P')
                  ? nextRewardLabel.slice(0, -1)
                  : nextRewardLabel,
              })}
            </p>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full"
              loading={claiming}
              data-testid="home-attendance-claim"
              onClick={() => void claimAttendance()}
            >
              {t('earn.attendance.cta', { reward: todayRewardLabel })}
            </Button>
          )}

          {showStreakMilestone ? (
            <p
              className="text-accent m-0 text-sm font-medium"
              data-testid="home-attendance-milestone"
            >
              {t('daily.streak7Reached')}
            </p>
          ) : null}
        </CardBody>
      </Card>

      <section aria-labelledby="home-attendance-cycle-title">
        <h2
          id="home-attendance-cycle-title"
          className="text-foreground m-0 mb-3 text-lg font-semibold"
        >
          {t('earn.attendance.cycleTitle')}
        </h2>
        <div className="grid grid-cols-7 gap-2" data-testid="home-attendance-cycle">
          {cycleDays.map((day) => (
            <div
              key={day.day}
              data-testid={`home-attendance-cycle-day-${day.day}`}
              className={cn(
                'flex flex-col items-center gap-1 rounded-(--ds-radius-md) border px-1 py-2 text-center',
                day.state === 'completed' && 'border-success/40 bg-success/10',
                day.state === 'current' && 'border-accent bg-accent/10 ring-accent/40 ring-2',
                day.state === 'upcoming' && 'border-border bg-surface-elevated',
              )}
            >
              <span className="text-foreground-muted text-[10px] font-medium uppercase">
                {t('earn.attendance.day', { n: day.day })}
              </span>
              <span className="text-foreground text-xs font-semibold tabular-nums">
                {day.rewardLabel}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardBody>
            <p className="text-foreground-muted m-0 text-xs">{t('daily.totalEarnedLabel')}</p>
            <p className="text-foreground m-0 text-lg font-semibold tabular-nums">
              {totalEarnedLabel}
            </p>
          </CardBody>
        </Card>
        {streak && streak.currentStreak > 0 ? (
          <Card>
            <CardBody>
              <p className="text-foreground-muted m-0 text-xs">
                {t('earn.attendance.streakLabel')}
              </p>
              <p className="text-foreground m-0 text-lg font-semibold tabular-nums">
                {t('daily.streak', { days: streak.currentStreak })}
              </p>
            </CardBody>
          </Card>
        ) : null}
      </div>

      <RoutineCard
        title={t('earn.routine.title')}
        steps={routineSteps.map((step) => ({
          id: step.id,
          label: t(step.labelKey),
          duration: t(step.durationKey),
          route: step.route,
          done: step.done,
          current: step.current,
        }))}
      />

      {error ? (
        <p
          className="text-destructive m-0 text-sm"
          role="alert"
          data-testid="home-attendance-error"
        >
          {t(error)}
        </p>
      ) : null}
    </div>
  );
}
