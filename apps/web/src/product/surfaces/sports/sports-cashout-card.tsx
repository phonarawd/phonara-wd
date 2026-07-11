import { useState } from 'react';
import type { MessageKey } from '@phonara/i18n';

import {
  shouldShowSportsCashoutCard,
  SPORTS_LAUNCH_GATE_DEFAULTS,
} from '@/domain/sports-cashout-combo-display-contract';
import { EW_E22_PARTIAL_CASHOUT_PERCENT_PRESETS } from '@/domain/ew-e22-ui-sports-parity-unlocks-display-contract';
import { LAUNCH_GATES } from '@/lib/launch-gates';
import { sportsPartialCashoutPortionFromPercent } from '@/features/sports/sports-slip-display';
import {
  useCashoutSportsBet,
  usePartialCashoutSportsBet,
  usePreviewSportsCashout,
  usePreviewSportsPartialCashout,
} from '@/features/sports/use-sports-betting';
import { translateError } from '@/lib/translate-error';
import { Button } from '@/product/primitives/button';
import { ConfirmDialog } from '@/product/primitives/confirm-dialog';
import { MoneyDisplay } from '@/product/primitives/money-display';
import { productToast } from '@/product/primitives/toast-zone';

type SportsCashoutCardProps = {
  betId: string;
  betStatus: string | undefined;
  stake?: string;
  currency: 'PHON' | 'USDT';
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  sportsCashoutGate?: boolean;
  sportsParityLive?: boolean;
};

/**
 * Full cash-out card — EXISTS `rpc_preview_sports_cashout` / `rpc_cashout_sports_bet`.
 * Partial cashout header — E22 UI (`rpc_partial_cashout_sports_bet`) when `sportsParityLive`.
 */
export function SportsCashoutCard({
  betId,
  betStatus,
  stake,
  currency,
  t,
  sportsCashoutGate = SPORTS_LAUNCH_GATE_DEFAULTS.sportsCashout,
  sportsParityLive = LAUNCH_GATES.sportsParityLive,
}: SportsCashoutCardProps) {
  const status =
    betStatus === 'won' ||
    betStatus === 'lost' ||
    betStatus === 'void' ||
    betStatus === 'cashed_out'
      ? betStatus
      : 'pending';

  const visible = shouldShowSportsCashoutCard(status, sportsCashoutGate);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [partialConfirmOpen, setPartialConfirmOpen] = useState(false);
  const [portionPercent, setPortionPercent] =
    useState<(typeof EW_E22_PARTIAL_CASHOUT_PERCENT_PRESETS)[number]>(50);

  const stakePortion =
    sportsParityLive && stake
      ? sportsPartialCashoutPortionFromPercent(stake, portionPercent)
      : null;

  const preview = usePreviewSportsCashout(visible ? betId : undefined, { liveRefresh: true });
  const partialPreview = usePreviewSportsPartialCashout(
    visible && sportsParityLive ? betId : undefined,
    stakePortion ?? undefined,
  );
  const cashout = useCashoutSportsBet();
  const partialCashout = usePartialCashoutSportsBet();

  if (!visible) return null;

  const offer = preview.data?.cashout_amount;
  const partialOffer = partialPreview.data?.cashout_amount;
  const busy = cashout.isPending || preview.isFetching;
  const partialBusy = partialCashout.isPending || partialPreview.isFetching;

  const onConfirmFull = () => {
    if (!offer) return;
    void (async () => {
      try {
        await cashout.mutateAsync({
          betId,
          cashoutAmount: offer,
          idempotencyKey: crypto.randomUUID(),
        });
        setConfirmOpen(false);
        productToast.show({ zone: 'strict', key: 'sports.cashout.success' });
      } catch (error) {
        productToast.show({ zone: 'strict', key: translateError(error) });
      }
    })();
  };

  const onConfirmPartial = () => {
    if (!stakePortion || !partialOffer) return;
    void (async () => {
      try {
        await partialCashout.mutateAsync({
          betId,
          stakePortion,
          cashoutAmount: partialOffer,
          idempotencyKey: crypto.randomUUID(),
        });
        setPartialConfirmOpen(false);
        productToast.show({ zone: 'strict', key: 'sports.cashout.partial.success' });
      } catch (error) {
        productToast.show({ zone: 'strict', key: translateError(error) });
      }
    })();
  };

  return (
    <div className="mt-2 flex flex-col gap-2" data-testid="sports-cashout-card">
      <div className="flex items-center justify-between gap-2">
        <span className="text-foreground-muted text-xs">{t('sports.cashout.preview')}</span>
        {offer ? (
          <MoneyDisplay amount={offer} currency={currency} showCurrency className="text-xs" />
        ) : (
          <span className="text-foreground-muted text-xs">
            {preview.isLoading ? t('sports.cashout.loading') : t('sports.cashout.unavailable')}
          </span>
        )}
      </div>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={!offer || busy}
        data-testid="sports-cashout-cta"
        onClick={() => setConfirmOpen(true)}
      >
        {t('sports.cashout.cta')}
      </Button>

      {sportsParityLive && stake ? (
        <div
          className="border-line flex flex-col gap-2 rounded-(--ds-radius-md) border px-2 py-2"
          data-testid="sports-partial-cashout-header"
        >
          <span className="text-foreground-muted text-xs">{t('sports.cashout.partial.title')}</span>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={t('sports.cashout.partial.title')}
          >
            {EW_E22_PARTIAL_CASHOUT_PERCENT_PRESETS.map((preset) => {
              const portion = sportsPartialCashoutPortionFromPercent(stake, preset);
              return (
                <Button
                  key={preset}
                  type="button"
                  size="sm"
                  variant={portionPercent === preset ? 'primary' : 'outline'}
                  data-testid={`sports-partial-cashout-percent-${preset}`}
                  aria-pressed={portionPercent === preset}
                  disabled={!portion || busy || partialBusy}
                  onClick={() => setPortionPercent(preset)}
                >
                  {preset}%
                </Button>
              );
            })}
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-foreground-muted text-xs">
              {t('sports.cashout.partial.preview')}
            </span>
            {partialOffer ? (
              <MoneyDisplay
                amount={partialOffer}
                currency={currency}
                showCurrency
                className="text-xs"
              />
            ) : (
              <span className="text-foreground-muted text-xs">
                {partialPreview.isLoading
                  ? t('sports.cashout.loading')
                  : t('sports.cashout.unavailable')}
              </span>
            )}
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!stakePortion || !partialOffer || partialBusy}
            data-testid="sports-partial-cashout-cta"
            onClick={() => setPartialConfirmOpen(true)}
          >
            {t('sports.cashout.partial.cta')}
          </Button>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('sports.cashout.confirm.title')}
        description={t('sports.cashout.confirm.body')}
        confirmLabel={t('sports.cashout.cta')}
        cancelLabel={t('common.cta.cancel')}
        loading={cashout.isPending}
        onConfirm={onConfirmFull}
      />
      <ConfirmDialog
        open={partialConfirmOpen}
        onOpenChange={setPartialConfirmOpen}
        title={t('sports.cashout.partial.confirm.title')}
        description={t('sports.cashout.partial.confirm.body')}
        confirmLabel={t('sports.cashout.partial.cta')}
        cancelLabel={t('common.cta.cancel')}
        loading={partialCashout.isPending}
        onConfirm={onConfirmPartial}
      />
    </div>
  );
}
