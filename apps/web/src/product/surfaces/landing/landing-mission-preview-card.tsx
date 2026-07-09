import { Star } from 'lucide-react';

import {
  LANDING_MISSION_PREVIEW_DIFFICULTY,
  LANDING_MISSION_PREVIEW_DURATION_KEYS,
  type LandingLiveMissionId,
  type LandingMissionTeaser,
} from '@/domain/landing-display-contract';
import { landingAnalyticsEventAttr } from '@/domain/landing-analytics-display-contract';
import { useT } from '@/product/i18n';
import { buttonVariants } from '@/product/primitives/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/product/primitives/card';
import { cn } from '@/product/primitives/lib/cn';

export type LandingMissionPreviewCardProps = {
  mission: LandingMissionTeaser;
  signupHref: string;
  variant?: 'featured' | 'compact';
  className?: string;
};

function DifficultyStars({ missionId }: { missionId: LandingLiveMissionId }) {
  const t = useT();
  const difficulty = LANDING_MISSION_PREVIEW_DIFFICULTY[missionId];

  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={t('landing.missions.preview.difficultyAria', { count: String(difficulty) })}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={cn(
            'size-3.5',
            index < difficulty ? 'fill-accent text-accent' : 'text-foreground-muted/40',
          )}
          aria-hidden
        />
      ))}
    </div>
  );
}

/** Time-first mission teaser — presentation difficulty stars, CTA → signup (CVR §3.3). */
export function LandingMissionPreviewCard({
  mission,
  signupHref,
  variant = 'compact',
  className,
}: LandingMissionPreviewCardProps) {
  const t = useT();
  const missionId = mission.id as LandingLiveMissionId;
  const durationKey = LANDING_MISSION_PREVIEW_DURATION_KEYS[missionId];
  const isFeatured = variant === 'featured';

  return (
    <Card
      className={cn(isFeatured && 'border-accent/30 bg-surface-raised', className)}
      data-testid={
        isFeatured ? 'landing-mission-preview-featured' : `landing-mission-preview-${mission.id}`
      }
    >
      <CardHeader className={cn('pb-0', isFeatured ? 'gap-3' : 'gap-2')}>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className={cn('text-base', isFeatured && 'text-lg')}>
            {t(mission.titleKey)}
          </CardTitle>
          <span className="text-foreground-muted shrink-0 text-xs font-medium tabular-nums">
            {t(durationKey)}
          </span>
        </div>
        <DifficultyStars missionId={missionId} />
      </CardHeader>
      <CardBody className={cn('flex flex-col gap-3', isFeatured ? 'pt-4' : 'pt-3')}>
        <p
          className={cn(
            'text-accent m-0 font-semibold tabular-nums',
            isFeatured ? 'text-2xl' : 'text-lg',
          )}
        >
          {mission.rewardLabel}
        </p>
        {isFeatured ? (
          <a
            href={signupHref}
            className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'w-full')}
            data-testid="landing-mission-preview-cta"
            {...landingAnalyticsEventAttr('landing.mission.click')}
          >
            {t('landing.missions.preview.cta')}
          </a>
        ) : null}
      </CardBody>
    </Card>
  );
}
