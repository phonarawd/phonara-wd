import { useMemo } from 'react';

import {
  formatLandingPhonAmount,
  LANDING_CUMULATIVE_STAT_IDS,
  LANDING_CUMULATIVE_STATS_PRESENTATION,
  landingCumulativeStatLabelKey,
  landingCumulativeStatValueKey,
  type LandingCumulativeStatId,
} from '@/domain/landing-display-contract';
import { resolveLandingMemberDisplay } from '@/domain/landing-member-bot';
import { useT } from '@/product/i18n';
import { Card, CardBody, CardHeader, CardTitle } from '@/product/primitives/card';
import { cn } from '@/product/primitives/lib/cn';

export type LandingCumulativeStatsProps = {
  className?: string;
};

function formatStatValue(id: LandingCumulativeStatId, raw: number): string {
  if (id === 'members' || id === 'withdrawals') {
    return raw.toLocaleString('en-US');
  }
  return formatLandingPhonAmount(raw);
}

/** L0a cumulative social proof — presentation bot for members · no zero-state (CVR §4). */
export function LandingCumulativeStats({ className }: LandingCumulativeStatsProps) {
  const t = useT();
  const memberCount = useMemo(() => resolveLandingMemberDisplay(), []);

  function resolveStatRaw(statId: LandingCumulativeStatId): number {
    if (statId === 'members') return memberCount;
    return LANDING_CUMULATIVE_STATS_PRESENTATION[statId];
  }

  return (
    <section
      className={cn('flex flex-col gap-4', className)}
      data-testid="landing-cumulative-stats"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-foreground m-0 text-2xl font-semibold">{t('landing.stats.title')}</h2>
        <p className="text-foreground-muted m-0 text-sm">{t('landing.stats.subtitle')}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {LANDING_CUMULATIVE_STAT_IDS.map((statId) => {
          const raw = resolveStatRaw(statId);
          const formatted = formatStatValue(statId, raw);
          return (
            <Card key={statId} className="border-accent/15">
              <CardHeader className="pb-0">
                <CardTitle className="text-sm font-medium">
                  {t(landingCumulativeStatLabelKey(statId))}
                </CardTitle>
              </CardHeader>
              <CardBody className="pt-2">
                <p className="text-accent m-0 text-2xl font-semibold tabular-nums">
                  {t(landingCumulativeStatValueKey(statId), { value: formatted })}
                </p>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
