import {
  findLandingMissionTeaser,
  LANDING_MISSION_PREVIEW_COMPACT_IDS,
  LANDING_MISSION_PREVIEW_FEATURED_ID,
} from '@/domain/landing-display-contract';

import { LandingMissionPreviewCard } from './landing-mission-preview-card';

/** Hero-adjacent fold — 1 featured + 2 compact mission teasers (CVR §3.3). */
export function LandingMissionPreviewRow({ signupHref }: { signupHref: string }) {
  const featured = findLandingMissionTeaser(LANDING_MISSION_PREVIEW_FEATURED_ID);

  return (
    <section className="flex flex-col gap-4" data-testid="landing-mission-preview">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-start">
        <LandingMissionPreviewCard mission={featured} signupHref={signupHref} variant="featured" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {LANDING_MISSION_PREVIEW_COMPACT_IDS.map((missionId) => (
            <LandingMissionPreviewCard
              key={missionId}
              mission={findLandingMissionTeaser(missionId)}
              signupHref={signupHref}
              variant="compact"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
