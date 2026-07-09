import { useRouterState } from '@tanstack/react-router';

import { useTradeFirstVisitEducation } from '@/features/trade/use-trade-first-visit-education';
import { TradeFirstVisitEducationSheet } from '@/product/surfaces/trade/trade-first-visit-education-sheet';

import { tradeSurfaceRouteMatcher } from './shell-route-matchers';

/** Mounts first-visit trade education on `/trade/*` only — no new routes (§32.5). */
export function TradeFirstVisitEducationGate() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = tradeSurfaceRouteMatcher(pathname);
  const { open, dismiss } = useTradeFirstVisitEducation(active);

  if (!open) return null;

  return <TradeFirstVisitEducationSheet open={open} onDismiss={dismiss} />;
}
