import { Wifi, WifiOff } from 'lucide-react';

import type { RealtimeConnectionStatus } from '@/hooks/use-realtime';
import { useT } from '@/product/i18n';
import { Button } from '@/product/primitives/button';
import { cn } from '@/product/primitives/lib/cn';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/product/primitives/tooltip';

export type CasinoTrustStripProps = {
  /** `casino-game-meta.ts` RTP for the active game (0-100, engine-configured). */
  rtp: number;
  connectionStatus: RealtimeConnectionStatus;
  connectionDisconnected: boolean;
  className?: string;
};

/**
 * Casino shell trust strip (Phase 1A · CASINO_UX_CANON §Trust layer) — RTP +
 * network status, always mounted (never overlay/modal-only) next to `PfStrip`.
 * Display-only: RTP is the engine-configured value from `casino-game-meta.ts`,
 * connection status mirrors the pooled `wallets` realtime channel.
 */
export function CasinoTrustStrip({
  rtp,
  connectionStatus,
  connectionDisconnected,
  className,
}: CasinoTrustStripProps) {
  const t = useT();

  return (
    <div
      className={cn('flex flex-wrap items-center gap-2 text-xs', className)}
      data-testid="casino-trust-strip"
    >
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              className="border-line bg-surface-raised text-foreground-muted h-auto gap-1.5 rounded-md border px-2 py-1 text-xs font-normal"
              data-testid="casino-rtp-badge"
            >
              <span>{t('casino.hub.rtp.label')}</span>
              <span
                className="text-foreground font-medium tabular-nums"
                data-testid="casino-rtp-value"
              >
                {rtp.toFixed(2)}%
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent data-testid="casino-rtp-tooltip">
            {t('casino.hub.rtp.tooltip')}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <span
        role="status"
        aria-live="polite"
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border px-2 py-1',
          connectionDisconnected
            ? 'border-danger/30 bg-danger/10 text-danger'
            : 'border-line bg-surface-raised text-foreground-muted',
        )}
        data-testid="casino-connection-status"
        data-connection-status={connectionStatus}
        data-connection-disconnected={connectionDisconnected ? 'true' : 'false'}
      >
        {connectionDisconnected ? (
          <WifiOff className="size-3.5 shrink-0" aria-hidden />
        ) : (
          <Wifi className="size-3.5 shrink-0" aria-hidden />
        )}
        <span>
          {connectionDisconnected ? t('casino.connection.disconnected') : t('casino.connection.live')}
        </span>
      </span>
    </div>
  );
}
