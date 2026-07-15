import type { MessageKey } from '@phonara/i18n';

import {
  formatSportsLiveScore,
  resolveSportsLiveSuspendKind,
  resolveSportsLiveSuspendMessageKey,
  SPORTS_LIVE_BADGE_KEY,
  SPORTS_LIVE_DELAY_NOTICE_KEY,
  SPORTS_LIVE_SCORE_LABEL_KEY,
  type SportsLiveFixtureState,
} from '@/domain/sports-live-surface-display-contract';
import { cn } from '@/product/primitives/lib/cn';

type SportsLiveInPlayBannerProps = {
  state: SportsLiveFixtureState | null | undefined;
  /** Board-level delay notice (always shown on /sports/live). */
  showDelayNotice?: boolean;
  realtimeConnected?: boolean;
  stale?: boolean;
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  className?: string;
};

/** Sports#2 live in-play banner — score · suspend · delay (RPC display only). */
export function SportsLiveInPlayBanner({
  state,
  showDelayNotice = false,
  realtimeConnected = false,
  stale = false,
  t,
  className,
}: SportsLiveInPlayBannerProps) {
  const score = state
    ? formatSportsLiveScore(state.result_home_goals, state.result_away_goals)
    : null;
  const suspendKind = resolveSportsLiveSuspendKind(state);
  const suspendKey = resolveSportsLiveSuspendMessageKey(suspendKind);

  if (!state && !showDelayNotice) return null;

  return (
    <div
      className={cn(
        'border-accent/30 bg-surface flex flex-col gap-2 rounded-(--ds-radius-lg) border px-3 py-2',
        className,
      )}
      data-testid="sports-live-inplay-banner"
      data-live-status={state?.status ?? 'none'}
      data-suspend-kind={suspendKind ?? 'none'}
      data-realtime={realtimeConnected ? 'connected' : 'idle'}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="bg-danger/15 text-danger inline-flex items-center rounded-(--ds-radius-sm) px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide uppercase"
          data-testid="sports-live-badge"
        >
          {t(SPORTS_LIVE_BADGE_KEY)}
        </span>
        {stale ? (
          <span className="text-foreground-muted text-xs" data-testid="sports-live-stale">
            {t('sports.live.stale')}
          </span>
        ) : null}
        {state ? (
          <span className="text-foreground m-0 text-sm font-medium">
            {state.home_name} {t('sports.fixture.vs')} {state.away_name}
          </span>
        ) : null}
        {score ? (
          <span
            className="text-foreground ml-auto text-base font-semibold tabular-nums"
            data-testid="sports-live-score"
            aria-label={t(SPORTS_LIVE_SCORE_LABEL_KEY)}
          >
            {score}
          </span>
        ) : null}
      </div>

      {suspendKey ? (
        <p
          className="text-warning m-0 text-sm"
          role="status"
          data-testid="sports-live-suspend-banner"
        >
          {t(suspendKey)}
          {state?.suspend_reason ? (
            <span className="text-foreground-muted"> · {state.suspend_reason}</span>
          ) : null}
        </p>
      ) : null}

      {showDelayNotice ? (
        <p className="text-foreground-muted m-0 text-xs" data-testid="sports-live-delay-notice">
          {t(SPORTS_LIVE_DELAY_NOTICE_KEY)}
        </p>
      ) : null}
    </div>
  );
}
