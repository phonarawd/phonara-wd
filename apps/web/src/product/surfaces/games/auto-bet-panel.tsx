import type { MessageKey } from '@phonara/i18n';

import type { AutoBetConfig, AutoBetQueueStatus } from '@/features/casino/use-auto-bet-queue';
import { useT } from '@/product/i18n';
import { Button } from '@/product/primitives/button';
import { MoneyDisplay } from '@/product/primitives/money-display';
import { cn } from '@/product/primitives/lib/cn';
import type { SpendCurrency } from '@/product/primitives/spend-currency-selector';

export type AutoBetPanelProps = {
  currency: SpendCurrency;
  config: AutoBetConfig;
  onConfigChange: (next: AutoBetConfig) => void;
  status: AutoBetQueueStatus;
  remaining: number | null;
  cumulativeProfit: string;
  nextStake: string;
  canStart: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
  className?: string;
};

function FieldLabel({ labelKey }: { labelKey: MessageKey }) {
  const t = useT();
  return <label className="text-foreground-muted text-xs font-medium">{t(labelKey)}</label>;
}

/** First-class Auto Bet panel — count · stop limits · onWin/onLoss · start/stop. */
export function AutoBetPanel({
  currency,
  config,
  onConfigChange,
  status,
  remaining,
  cumulativeProfit,
  nextStake,
  canStart,
  onStart,
  onStop,
  disabled = false,
  className,
}: AutoBetPanelProps) {
  const t = useT();
  const running = status === 'running' || status === 'stopping' || status === 'paused';
  const lockFields = running || disabled;

  return (
    <div
      className={cn('flex flex-col gap-3', className)}
      data-testid="casino-auto-bet-panel"
      data-auto-status={status}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <FieldLabel labelKey="casino.auto.count" />
          <input
            type="number"
            min={0}
            className="border-line bg-surface text-foreground min-h-12 rounded-md border px-3 tabular-nums"
            value={config.count}
            disabled={lockFields}
            data-testid="casino-auto-count"
            onChange={(e) =>
              onConfigChange({ ...config, count: Math.max(0, Number(e.target.value) || 0) })
            }
          />
          <p className="text-foreground-muted m-0 text-xs">{t('casino.auto.infinite')}</p>
        </div>
        <div className="flex flex-col gap-1">
          <FieldLabel labelKey="casino.auto.nextStake" />
          <MoneyDisplay amount={nextStake} currency={currency} showCurrency className="text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <FieldLabel labelKey="casino.auto.stopProfit" />
          <input
            type="text"
            inputMode="decimal"
            className="border-line bg-surface text-foreground min-h-12 rounded-md border px-3 tabular-nums"
            value={config.stopOnProfit}
            disabled={lockFields}
            data-testid="casino-auto-stop-profit"
            onChange={(e) => onConfigChange({ ...config, stopOnProfit: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <FieldLabel labelKey="casino.auto.stopLoss" />
          <input
            type="text"
            inputMode="decimal"
            className="border-line bg-surface text-foreground min-h-12 rounded-md border px-3 tabular-nums"
            value={config.stopOnLoss}
            disabled={lockFields}
            data-testid="casino-auto-stop-loss"
            onChange={(e) => onConfigChange({ ...config, stopOnLoss: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <FieldLabel labelKey="casino.auto.onWin" />
          <select
            className="border-line bg-surface text-foreground min-h-12 rounded-md border px-3"
            value={config.onWinMode}
            disabled={lockFields}
            data-testid="casino-auto-on-win"
            onChange={(e) =>
              onConfigChange({
                ...config,
                onWinMode: e.target.value === 'increase' ? 'increase' : 'reset',
              })
            }
          >
            <option value="reset">{t('casino.auto.modeReset')}</option>
            <option value="increase">{t('casino.auto.modeIncrease')}</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <FieldLabel labelKey="casino.auto.onLoss" />
          <select
            className="border-line bg-surface text-foreground min-h-12 rounded-md border px-3"
            value={config.onLossMode}
            disabled={lockFields}
            data-testid="casino-auto-on-loss"
            onChange={(e) =>
              onConfigChange({
                ...config,
                onLossMode: e.target.value === 'increase' ? 'increase' : 'reset',
              })
            }
          >
            <option value="reset">{t('casino.auto.modeReset')}</option>
            <option value="increase">{t('casino.auto.modeIncrease')}</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-foreground-muted">{t('casino.auto.remaining')}</span>
        <span className="tabular-nums" data-testid="casino-auto-remaining">
          {remaining === null ? '∞' : remaining}
        </span>
        <span className="text-foreground-muted">{t('casino.auto.profit')}</span>
        <MoneyDisplay
          amount={cumulativeProfit}
          currency={currency}
          signed
          showCurrency
          className="text-sm"
        />
      </div>

      {running ? (
        <Button
          type="button"
          variant="destructive"
          disabled={disabled || status === 'stopping'}
          data-testid="casino-auto-stop"
          onClick={onStop}
        >
          {status === 'stopping' ? t('casino.auto.stoppingAfterCurrent') : t('casino.auto.stop')}
        </Button>
      ) : (
        <Button
          type="button"
          variant="bet"
          disabled={disabled || !canStart}
          data-testid="casino-auto-start"
          onClick={onStart}
        >
          {t('casino.auto.start')}
        </Button>
      )}
    </div>
  );
}
