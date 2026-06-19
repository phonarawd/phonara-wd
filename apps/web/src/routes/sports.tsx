import { useState } from 'react';
import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { PresentationRoot } from '../presentation-import/presentation-root';
import { ImportedSportsPage } from '../presentation-import/pages/sports-page';
import type { LeagueKey } from '../components/sports/SportsLeagueChips';
import type { SportsTabKey } from '../components/sports/SportsTabs';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sports',
  component: ImportedSportsRoute,
});

/** L2-S wire defer — mock presentation only (no RPC). */
function ImportedSportsRoute() {
  const [tab, setTab] = useState<SportsTabKey>('featured');
  const [league, setLeague] = useState<LeagueKey>('all');

  return (
    <PresentationRoot>
      <ImportedSportsPage
        initialTab={tab}
        initialLeague={league}
        onChange={({ tab: nextTab, league: nextLeague }) => {
          setTab(nextTab);
          setLeague(nextLeague);
        }}
      />
    </PresentationRoot>
  );
}
