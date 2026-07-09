import { useRouterState } from '@tanstack/react-router';

import { usePriceAlertMonitor } from '@/features/trading/use-price-alert-monitor';
import { useTradeRealtimeFeedback } from '@/features/trading/use-trade-realtime-feedback';

import { tradeSurfaceRouteMatcher } from './shell-route-matchers';

/** Mounts async trade fill/liquidation/SLTP feedback on `/trade*` only. */
export function TradeRealtimeFeedbackGate() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const active = tradeSurfaceRouteMatcher(pathname);
  useTradeRealtimeFeedback(active);
  usePriceAlertMonitor(active);
  return null;
}
