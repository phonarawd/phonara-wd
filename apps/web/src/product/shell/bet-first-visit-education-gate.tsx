import { useRouterState } from '@tanstack/react-router';

import { useBetFirstVisitEducation } from '@/features/responsible-gaming/use-bet-first-visit-education';

import { BetFirstVisitEducationSheet } from './bet-first-visit-education-sheet';
import { casinoSurfaceRouteMatcher, sportsSurfaceRouteMatcher } from './shell-route-matchers';

/** Mounts first-visit bet education on `/sports/*` · `/casino/*` · `/games/*` only — no new routes (§32.5). */
export function BetFirstVisitEducationGate() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = sportsSurfaceRouteMatcher(pathname) || casinoSurfaceRouteMatcher(pathname);
  const { open, dismiss } = useBetFirstVisitEducation(active);

  if (!open) return null;

  return <BetFirstVisitEducationSheet open={open} onDismiss={dismiss} />;
}
