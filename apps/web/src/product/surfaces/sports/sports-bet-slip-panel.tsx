import type { SportsBetSlipState } from '@/features/sports/use-sports-bet-slip-state';
import type { SportsStakeCurrency } from '@/domain/sports-page-display-contract';
import {
  isSportsBalancePercentPresetActive,
  SPORTS_BALANCE_PERCENT_PRESETS,
  sportsStakeFromBalancePercent,
} from '@/features/sports/sports-slip-display';
import { Button } from '@/product/primitives/button';
import { ConfirmDialog } from '@/product/primitives/confirm-dialog';
import { Input } from '@/product/primitives/input';
import { MoneyDisplay } from '@/product/primitives/money-display';
import { SpendCurrencySelector } from '@/product/primitives/spend-currency-selector';
import { cn } from '@/product/primitives/lib/cn';
import type { MessageKey } from '@phonara/i18n';

type SportsBetSlipPanelProps = {
  slip: SportsBetSlipState;
  phonAvail: string;
  usdtAvail: string;
  sportsBlocked: boolean;
  sportsBlockedKey: MessageKey;
  canPlaceBet: boolean;
  placeBetBusy: boolean;
  confirmOpen: boolean;
  onConfirmOpenChange: (open: boolean) => void;
  onRequestPlaceBet: () => void;
  onConfirmPlaceBet: () => Promise<void>;
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  className?: string;
};

export function SportsBetSlipPanel({
  slip,
  phonAvail,
  usdtAvail,
  sportsBlocked,
  sportsBlockedKey,
  canPlaceBet,
  placeBetBusy,
  confirmOpen,
  onConfirmOpenChange,
  onRequestPlaceBet,
  onConfirmPlaceBet,
  t,
  className,
}: SportsBetSlipPanelProps) {
  const avail = slip.stakeCurrency === 'PHON' ? phonAvail : usdtAvail;

  return (
    <>
      <section
        data-testid="sports-bet-slip-panel"
        className={cn(
          'border-line bg-surface flex min-h-0 flex-col rounded-(--ds-radius-lg) border',
          className,
        )}
      >
        <header className="border-line flex items-center justify-between gap-2 border-b px-3 py-2">
          <h2 className="text-foreground m-0 text-sm font-semibold">{t('sports.slip.title')}</h2>
          {slip.selections.length > 0 ? (
            <Button type="button" size="sm" variant="ghost" onClick={slip.clearSlip}>
              {t('sports.slip.clear')}
            </Button>
          ) : null}
        </header>

        <div className="flex flex-1 flex-col gap-4 p-3">
          {sportsBlocked ? (
            <p className="text-foreground-muted m-0 text-sm" role="status">
              {t(sportsBlockedKey)}
            </p>
          ) : null}

          {slip.selections.length === 0 ? (
            <p className="text-foreground-muted m-0 text-sm">{t('sports.slip.empty')}</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {slip.selections.map((row) => (
                <li
                  key={row.outcomeId}
                  className="border-line flex items-start justify-between gap-2 rounded-(--ds-radius-md) border px-2 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="text-foreground m-0 truncate font-medium">
                      {row.homeName} {t('sports.fixture.vs')} {row.awayName}
                    </p>
                    <p className="text-foreground-muted m-0 text-xs tabular-nums">
                      @{row.oddsAtBet}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label={t('sports.slip.clear')}
                    onClick={() => slip.removeSelection(row.outcomeId)}
                  >
                    ×
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <SpendCurrencySelector
            value={slip.stakeCurrency}
            onChange={(currency) => slip.setStakeCurrency(currency as SportsStakeCurrency)}
            testId="sports-stake-currency-selector"
            currencyTestIdPrefix="sports-stake-currency"
            ariaLabel="common.spendCurrency"
            disabled={sportsBlocked}
          />

          <div
            className="border-line grid gap-2 rounded-(--ds-radius-md) border px-2 py-2"
            data-testid="sports-slip-balances"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-foreground-muted text-xs">USDT</span>
              <MoneyDisplay
                amount={usdtAvail}
                currency="USDT"
                showCurrency
                className="text-sm font-medium"
              />
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-foreground-muted text-xs">PHON</span>
              <MoneyDisplay
                amount={phonAvail}
                currency="PHON"
                showCurrency
                className="text-sm font-medium"
              />
            </div>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-foreground-muted text-xs">{t('sports.slip.stake')}</span>
            <Input
              inputMode="decimal"
              value={slip.stake}
              disabled={sportsBlocked}
              data-testid="sports-slip-stake-input"
              onChange={(event) => slip.setStake(event.target.value)}
            />
          </label>

          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={t('trade.order.balancePercent')}
          >
            {SPORTS_BALANCE_PERCENT_PRESETS.map((preset) => {
              const active = isSportsBalancePercentPresetActive(avail, slip.stake, preset);
              return (
                <Button
                  key={preset}
                  type="button"
                  size="sm"
                  variant={active ? 'primary' : 'outline'}
                  data-testid={`sports-balance-percent-${preset}`}
                  aria-pressed={active}
                  disabled={sportsBlocked}
                  onClick={() => slip.setStake(sportsStakeFromBalancePercent(avail, preset))}
                >
                  {preset}%
                </Button>
              );
            })}
          </div>

          <dl className="m-0 grid gap-2 text-sm">
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-foreground-muted">{t('trade.order.avail')}</dt>
              <dd className="m-0" data-testid="sports-slip-avail">
                <MoneyDisplay
                  amount={avail}
                  currency={slip.stakeCurrency}
                  showCurrency
                  className="text-foreground text-sm font-medium"
                />
              </dd>
            </div>
            {slip.combinedOddsDisplay ? (
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-foreground-muted">{t('sports.slip.combined')}</dt>
                <dd className="text-foreground m-0 tabular-nums">{slip.combinedOddsDisplay}</dd>
              </div>
            ) : null}
            {slip.potentialPayoutDisplay ? (
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-foreground-muted">{t('sports.slip.payout')}</dt>
                <dd className="m-0" data-testid="sports-slip-potential-payout">
                  <MoneyDisplay
                    amount={slip.potentialPayoutDisplay}
                    currency={slip.stakeCurrency}
                    showCurrency
                    className="text-foreground text-sm font-medium"
                  />
                </dd>
              </div>
            ) : null}
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-foreground-muted">{t('sports.slip.debit_bucket.label')}</dt>
              <dd className="text-foreground-muted m-0 text-xs">{t(slip.debitBucketKey)}</dd>
            </div>
          </dl>

          <Button
            type="button"
            variant="primary"
            className="w-full"
            data-testid="sports-slip-place-bet"
            disabled={!canPlaceBet}
            onClick={onRequestPlaceBet}
          >
            {placeBetBusy ? t('sports.slip.placing') : t('sports.slip.place')}
          </Button>
        </div>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={onConfirmOpenChange}
        title={t('sports.slip.confirm.title')}
        description={t('sports.slip.confirm.body')}
        confirmLabel={t('sports.slip.confirm')}
        onConfirm={() => {
          void onConfirmPlaceBet();
        }}
        loading={placeBetBusy}
        confirmDisabled={!canPlaceBet}
      />
    </>
  );
}
