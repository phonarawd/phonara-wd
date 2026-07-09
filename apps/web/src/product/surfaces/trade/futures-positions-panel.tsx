import { useState } from 'react';

import { toDecimal } from '@phonara/money';

import { TRADE_DESK_TABLE_SCROLL_CLASS } from '@/domain/trade-ultra-layout-display-contract';

import type { MessageKey } from '@phonara/i18n';

import {
  resolveMarkPriceForPosition,
  resolveRoePercentFromMark,
  resolveUnrealizedPnlFromMark,
  type PositionMarkDisplayInput,
} from '@/features/trading/order-ticket/compute-position-display-metrics';
import { TRADE_FUTURES_UI_CAPABILITIES } from '@/features/trading/trade-rpc-capabilities';
import { TradeHelpTip } from '@/features/trading/trade-beginner-help/trade-help-tip';

import type { FuturesPosition } from '@/hooks/use-trading';
import { isNegativeAmount, isPositiveAmount } from '@/lib/money-display';

import { isPositiveDecimalInput, normalizeDecimalInput } from '@/lib/money-input';

import { Button } from '@/product/primitives/button';

import { Skeleton } from '@/product/primitives/skeleton';

import { ConfirmDialog } from '@/product/primitives/confirm-dialog';

import { Input } from '@/product/primitives/input';

import { MoneyDisplay } from '@/product/primitives/money-display';

import { isTradeFiatHintEligibleCurrency } from '@/features/trading/trade-fiat-hint-display';

import { TradeMoneyWithFiatHint } from './trade-money-with-fiat-hint';

import { cn } from '@/product/primitives/lib/cn';

/** Engine-valid partial close ratios (0 < ratio < 1). */

export const FUTURES_PARTIAL_CLOSE_RATIO_PRESETS = ['0.25', '0.5', '0.75'] as const;

export type FuturesPartialCloseRatio = (typeof FUTURES_PARTIAL_CLOSE_RATIO_PRESETS)[number];

export type FuturesMarginAdjustDirection = 'add' | 'remove';

export type FuturesPositionsPanelProps = {
  positions: FuturesPosition[];

  t: (key: MessageKey) => string;

  className?: string;

  variant?: 'compact' | 'full';

  showHeading?: boolean;

  emptyKey?: MessageKey;

  onClosePosition?: (positionId: string) => void;

  closingPositionId?: string | null;

  closeBusy?: boolean;

  onPartialClosePosition?: (positionId: string, closeRatio: string) => void;

  partialClosingPositionId?: string | null;

  partialCloseBusy?: boolean;

  partialCloseEnabled?: boolean;

  onAdjustIsolatedMargin?: (positionId: string, delta: string) => void;

  adjustingMarginPositionId?: string | null;

  marginAdjustBusy?: boolean;

  marginAdjustEnabled?: boolean;

  onUpdatePositionSltp?: (
    positionId: string,
    stopLoss: string | null,
    takeProfit: string | null,
  ) => void;

  onSetTrailingStop?: (
    positionId: string,
    callbackRate: string,
    activationPrice?: string | null,
  ) => void;

  onClearTrailingStop?: (positionId: string) => void;

  updatingSltpPositionId?: string | null;

  trailingStopPositionId?: string | null;

  sltpEditBusy?: boolean;

  trailingStopBusy?: boolean;

  sltpEditEnabled?: boolean;

  trailingStopEnabled?: boolean;

  /** Oracle mark prices keyed by market symbol (RPC · not chart/WS). */
  markPrices?: Record<string, string | null | undefined>;

  /** When true for a market, unrealized PnL/ROE show `—` (stale/missing mark). */
  isMarkUnavailable?: (market: string) => boolean;

  loading?: boolean;
};

function resolveStatusLabel(position: FuturesPosition, t: FuturesPositionsPanelProps['t']) {
  if (position.status === 'liquidated') return t('trade.liquidated');

  if (position.status === 'closed') return t('trade.closed');

  return t('trade.positions.statusOpen');
}

function formatPartialCloseRatioLabel(ratio: string): string {
  const percent = Number(ratio) * 100;

  return Number.isFinite(percent) ? `${percent}%` : ratio;
}

function isIsolatedPosition(position: FuturesPosition): boolean {
  return position.margin_mode === 'isolated' || position.margin_mode == null;
}

function buildMarginDelta(direction: FuturesMarginAdjustDirection, amount: string): string | null {
  if (!isPositiveDecimalInput(amount)) return null;

  const abs = toDecimal(amount);

  if (direction === 'remove') {
    return abs.negated().toFixed(6);
  }

  return abs.toFixed(6);
}

function toMarkDisplayInput(position: FuturesPosition): PositionMarkDisplayInput {
  return {
    side: position.side,
    quantity: position.quantity,
    entryPrice: position.entry_price,
    marginAmount: position.margin_amount,
    marginCurrency: position.margin_currency as PositionMarkDisplayInput['marginCurrency'],
  };
}

function resolveRoeTone(percent: string): 'up' | 'down' | 'flat' {
  if (isPositiveAmount(percent)) return 'up';
  if (isNegativeAmount(percent)) return 'down';
  return 'flat';
}

function PositionPnlMoney({
  amount,
  currency,
  className,
  signed,
}: {
  amount: string;
  currency: string;
  className?: string;
  signed?: boolean;
}) {
  /** Signal Pulse on PnL display — L1 · reduced-motion/L2 instant (§34.15). */
  if (isTradeFiatHintEligibleCurrency(currency)) {
    return (
      <TradeMoneyWithFiatHint
        amount={amount}
        currency={currency as 'USDT' | 'PHON'}
        showCurrency
        signed={signed}
        countUp
        className={className}
      />
    );
  }
  return (
    <MoneyDisplay
      amount={amount}
      currency={currency as 'USDT' | 'PHON'}
      showCurrency
      signed={signed}
      countUp
      className={className}
    />
  );
}

function canSubmitMarginAdjust(
  direction: FuturesMarginAdjustDirection,
  amount: string,
  position: FuturesPosition | null,
): boolean {
  if (!position || !isPositiveDecimalInput(amount)) return false;

  if (direction === 'remove') {
    return toDecimal(amount).lessThanOrEqualTo(toDecimal(position.margin_amount));
  }

  return true;
}

function validatePositionStopLoss(
  side: FuturesPosition['side'],
  entryPrice: string,
  price: string,
): boolean {
  if (!isPositiveDecimalInput(price)) return false;
  const entry = toDecimal(entryPrice);
  const p = toDecimal(price);
  return side === 'long' ? p.lessThan(entry) : p.greaterThan(entry);
}

function validatePositionTakeProfit(
  side: FuturesPosition['side'],
  entryPrice: string,
  price: string,
): boolean {
  if (!isPositiveDecimalInput(price)) return false;
  const entry = toDecimal(entryPrice);
  const p = toDecimal(price);
  return side === 'long' ? p.greaterThan(entry) : p.lessThan(entry);
}

function canSubmitSltpEdit(
  position: FuturesPosition | null,
  slEnabled: boolean,
  slPrice: string,
  tpEnabled: boolean,
  tpPrice: string,
): boolean {
  if (!position) return false;
  if (slEnabled && !validatePositionStopLoss(position.side, position.entry_price, slPrice)) {
    return false;
  }
  if (tpEnabled && !validatePositionTakeProfit(position.side, position.entry_price, tpPrice)) {
    return false;
  }
  return true;
}

function formatSltpDisplay(value: string | null | undefined): string {
  return value != null && value !== '' ? value : '—';
}

export function FuturesPositionsPanel({
  positions,

  t,

  className,

  variant = 'compact',

  showHeading = true,

  emptyKey = 'trade.empty.positions',

  onClosePosition,

  closingPositionId = null,

  closeBusy = false,

  onPartialClosePosition,

  partialClosingPositionId = null,

  partialCloseBusy = false,

  partialCloseEnabled = TRADE_FUTURES_UI_CAPABILITIES.partialClose,

  onAdjustIsolatedMargin,

  adjustingMarginPositionId = null,

  marginAdjustBusy = false,

  marginAdjustEnabled = TRADE_FUTURES_UI_CAPABILITIES.isolatedMarginAdjust,
  onUpdatePositionSltp,
  onSetTrailingStop,
  onClearTrailingStop,
  updatingSltpPositionId = null,
  trailingStopPositionId = null,
  sltpEditBusy = false,
  trailingStopBusy = false,
  sltpEditEnabled = TRADE_FUTURES_UI_CAPABILITIES.positionTpSlEdit,
  trailingStopEnabled = TRADE_FUTURES_UI_CAPABILITIES.trailingStop,
  markPrices,
  isMarkUnavailable,
  loading = false,
}: FuturesPositionsPanelProps) {
  const isFull = variant === 'full';

  const showCloseAction = isFull && Boolean(onClosePosition);

  const showPartialCloseAction = isFull && partialCloseEnabled && Boolean(onPartialClosePosition);

  const showMarginAdjustAction = isFull && marginAdjustEnabled && Boolean(onAdjustIsolatedMargin);

  const showSltpEditAction = isFull && sltpEditEnabled && Boolean(onUpdatePositionSltp);

  const showActionColumn =
    showCloseAction || showPartialCloseAction || showMarginAdjustAction || showSltpEditAction;

  const actionBusy = closeBusy || partialCloseBusy || marginAdjustBusy || sltpEditBusy;

  const [partialCloseTarget, setPartialCloseTarget] = useState<FuturesPosition | null>(null);

  const [selectedRatio, setSelectedRatio] = useState<FuturesPartialCloseRatio>('0.5');

  const [marginAdjustTarget, setMarginAdjustTarget] = useState<FuturesPosition | null>(null);

  const [marginAdjustDirection, setMarginAdjustDirection] =
    useState<FuturesMarginAdjustDirection>('add');

  const [marginAdjustAmount, setMarginAdjustAmount] = useState('');

  const [sltpEditTarget, setSltpEditTarget] = useState<FuturesPosition | null>(null);
  const [trailingEnabled, setTrailingEnabled] = useState(false);
  const [trailingCallbackRate, setTrailingCallbackRate] = useState('0.05');
  const [trailingActivationPrice, setTrailingActivationPrice] = useState('');
  const [slEnabled, setSlEnabled] = useState(false);
  const [slPrice, setSlPrice] = useState('');
  const [tpEnabled, setTpEnabled] = useState(false);
  const [tpPrice, setTpPrice] = useState('');

  const partialCloseDialogOpen = partialCloseTarget !== null;

  const partialCloseDialogBusy =
    partialCloseBusy && partialClosingPositionId === partialCloseTarget?.id;

  const marginAdjustDialogOpen = marginAdjustTarget !== null;

  const marginAdjustDialogBusy =
    marginAdjustBusy && adjustingMarginPositionId === marginAdjustTarget?.id;

  const marginAdjustConfirmEnabled = canSubmitMarginAdjust(
    marginAdjustDirection,

    marginAdjustAmount,

    marginAdjustTarget,
  );

  const sltpEditDialogOpen = sltpEditTarget !== null;

  const sltpEditDialogBusy = sltpEditBusy && updatingSltpPositionId === sltpEditTarget?.id;
  const trailingDialogBusy = trailingStopBusy && trailingStopPositionId === sltpEditTarget?.id;
  const sltpDialogBusy = sltpEditDialogBusy || trailingDialogBusy;

  const sltpEditConfirmEnabled = trailingEnabled
    ? isPositiveDecimalInput(trailingCallbackRate)
    : canSubmitSltpEdit(sltpEditTarget, slEnabled, slPrice, tpEnabled, tpPrice);

  function openPartialCloseDialog(position: FuturesPosition) {
    setSelectedRatio('0.5');

    setPartialCloseTarget(position);
  }

  function closePartialCloseDialog() {
    if (partialCloseDialogBusy) return;

    setPartialCloseTarget(null);
  }

  function submitPartialClose() {
    if (!partialCloseTarget || !onPartialClosePosition || partialCloseDialogBusy) return;

    onPartialClosePosition(partialCloseTarget.id, selectedRatio);

    setPartialCloseTarget(null);
  }

  function openMarginAdjustDialog(position: FuturesPosition) {
    setMarginAdjustDirection('add');

    setMarginAdjustAmount('');

    setMarginAdjustTarget(position);
  }

  function closeMarginAdjustDialog() {
    if (marginAdjustDialogBusy) return;

    setMarginAdjustTarget(null);
  }

  function submitMarginAdjust() {
    if (!marginAdjustTarget || !onAdjustIsolatedMargin || marginAdjustDialogBusy) return;

    const delta = buildMarginDelta(marginAdjustDirection, marginAdjustAmount);

    if (!delta) return;

    onAdjustIsolatedMargin(marginAdjustTarget.id, delta);

    setMarginAdjustTarget(null);
  }

  function openSltpEditDialog(position: FuturesPosition) {
    const hasSl = position.stop_loss != null && position.stop_loss !== '';
    const hasTp = position.take_profit != null && position.take_profit !== '';
    const hasTrailing =
      position.trailing_stop_callback_rate != null && position.trailing_stop_callback_rate !== '';
    setSlEnabled(hasSl);
    setSlPrice(hasSl ? position.stop_loss! : '');
    setTpEnabled(hasTp);
    setTpPrice(hasTp ? position.take_profit! : '');
    setTrailingEnabled(hasTrailing);
    setTrailingCallbackRate(hasTrailing ? position.trailing_stop_callback_rate! : '0.05');
    setTrailingActivationPrice(position.trailing_stop_activation_price ?? '');
    setSltpEditTarget(position);
  }

  function closeSltpEditDialog() {
    if (sltpDialogBusy) return;
    setSltpEditTarget(null);
  }

  function submitSltpEdit() {
    if (!sltpEditTarget || sltpDialogBusy) return;

    if (trailingEnabled && trailingStopEnabled && onSetTrailingStop) {
      if (!isPositiveDecimalInput(trailingCallbackRate)) return;
      onSetTrailingStop(sltpEditTarget.id, trailingCallbackRate, trailingActivationPrice || null);
      if (tpEnabled && tpPrice && onUpdatePositionSltp) {
        if (!validatePositionTakeProfit(sltpEditTarget.side, sltpEditTarget.entry_price, tpPrice)) {
          return;
        }
        onUpdatePositionSltp(sltpEditTarget.id, null, tpPrice);
      }
      setSltpEditTarget(null);
      return;
    }

    if (!onUpdatePositionSltp) return;
    if (!canSubmitSltpEdit(sltpEditTarget, slEnabled, slPrice, tpEnabled, tpPrice)) return;
    const stopLoss = slEnabled && slPrice ? slPrice : null;
    const takeProfit = tpEnabled && tpPrice ? tpPrice : null;
    onUpdatePositionSltp(sltpEditTarget.id, stopLoss, takeProfit);
    setSltpEditTarget(null);
  }

  return (
    <section
      data-testid="futures-positions-panel"
      className={cn(
        'border-line bg-surface rounded-(--ds-radius-lg) border p-4',

        className,
      )}
    >
      {showHeading ? (
        <h2 className="text-foreground m-0 text-sm font-semibold">{t('trade.panel.positions')}</h2>
      ) : null}

      {loading ? (
        <Skeleton className="mt-3 h-24 w-full" data-testid="futures-positions-panel-loading" />
      ) : positions.length === 0 ? (
        <p className="text-foreground-muted m-0 mt-3 text-sm">{t(emptyKey)}</p>
      ) : (
        <div
          className={cn(
            showHeading ? 'mt-3' : undefined,
            TRADE_DESK_TABLE_SCROLL_CLASS,
            'overflow-x-auto',
          )}
        >
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="text-foreground-muted text-left text-xs">
                <th className="pb-2 font-medium">{t('confirm.row.market')}</th>

                <th className="pb-2 font-medium">{t('confirm.row.side')}</th>

                {isFull ? (
                  <th className="pb-2 font-medium">{t('trade.positions.columnStatus')}</th>
                ) : null}

                <th className="pb-2 font-medium">{t('trade.order.leverage')}</th>

                {isFull ? <th className="pb-2 font-medium">{t('trade.entryPrice')}</th> : null}

                {isFull ? <th className="pb-2 font-medium">{t('trade.quantity')}</th> : null}

                <th className="pb-2 font-medium">{t('trade.margin')}</th>

                <th className="pb-2 font-medium">
                  <TradeHelpTip termId="liquidation" className="text-xs font-normal" />
                </th>

                {isFull ? (
                  <th className="pb-2 font-medium">
                    <span className="inline-flex items-center gap-1">
                      {t('trade.unrealizedPnl')}
                      <TradeHelpTip termId="mark_price" className="text-xs font-normal" />
                    </span>
                  </th>
                ) : null}

                {isFull ? <th className="pb-2 font-medium">{t('trade.roe')}</th> : null}

                {isFull ? <th className="pb-2 font-medium">{t('trade.pnl')}</th> : null}

                {isFull && showSltpEditAction ? (
                  <th className="pb-2 font-medium">{t('confirm.row.stopLoss')}</th>
                ) : null}

                {isFull && showSltpEditAction ? (
                  <th className="pb-2 font-medium">{t('confirm.row.takeProfit')}</th>
                ) : null}

                {showActionColumn ? (
                  <th className="pb-2 font-medium">{t('trade.positions.columnAction')}</th>
                ) : null}
              </tr>
            </thead>

            <tbody>
              {positions.map((position) => {
                const isOpen = position.status === 'open';

                const rowClosing = closingPositionId === position.id;

                const rowPartialClosing = partialClosingPositionId === position.id;

                const rowMarginAdjusting = adjustingMarginPositionId === position.id;

                const rowSltpEditing = updatingSltpPositionId === position.id;

                const markPrice = isOpen
                  ? resolveMarkPriceForPosition(position.market, markPrices, isMarkUnavailable)
                  : null;
                const markInput = toMarkDisplayInput(position);
                const unrealizedPnl = isOpen
                  ? resolveUnrealizedPnlFromMark(markInput, markPrice)
                  : null;
                const roePercent = isOpen ? resolveRoePercentFromMark(markInput, markPrice) : null;
                const realizedPnl = isOpen ? null : position.realized_pnl;
                const roeTone = roePercent ? resolveRoeTone(roePercent) : 'flat';

                const rowMarginAdjust =
                  showMarginAdjustAction && isOpen && isIsolatedPosition(position);

                return (
                  <tr
                    key={position.id}
                    className="border-line border-t"
                    data-testid="futures-position-row"
                  >
                    <td className="py-2 tabular-nums">{position.market}</td>

                    <td className="py-2">
                      {t(position.side === 'long' ? 'trade.long' : 'trade.short')}
                    </td>

                    {isFull ? <td className="py-2">{resolveStatusLabel(position, t)}</td> : null}

                    <td className="py-2 tabular-nums">{position.leverage}x</td>

                    {isFull ? (
                      <td className="py-2">
                        <MoneyDisplay
                          amount={position.entry_price}
                          currency="USDT"
                          showCurrency
                          className="text-foreground text-sm tabular-nums"
                        />
                      </td>
                    ) : null}

                    {isFull ? <td className="py-2 tabular-nums">{position.quantity}</td> : null}

                    <td className="py-2">
                      <MoneyDisplay
                        amount={position.margin_amount}
                        currency={position.margin_currency}
                        showCurrency
                        className="text-foreground text-sm tabular-nums"
                      />
                    </td>

                    <td className="py-2">
                      <MoneyDisplay
                        amount={position.liquidation_price}
                        currency="USDT"
                        showCurrency
                        className="text-foreground text-sm tabular-nums"
                      />
                    </td>

                    {isFull ? (
                      <td className="py-2" data-testid={`futures-unrealized-pnl-${position.id}`}>
                        {unrealizedPnl ? (
                          <PositionPnlMoney
                            amount={unrealizedPnl}
                            currency={position.margin_currency}
                            signed
                            className="text-sm tabular-nums"
                          />
                        ) : (
                          <span className="text-foreground-muted">—</span>
                        )}
                      </td>
                    ) : null}

                    {isFull ? (
                      <td className="py-2" data-testid={`futures-roe-${position.id}`}>
                        {roePercent ? (
                          <span
                            className={cn(
                              'text-sm tabular-nums',
                              roeTone === 'up' && 'text-market-up',
                              roeTone === 'down' && 'text-market-down',
                              roeTone === 'flat' && 'text-foreground',
                            )}
                          >
                            {roePercent}%
                          </span>
                        ) : (
                          <span className="text-foreground-muted">—</span>
                        )}
                      </td>
                    ) : null}

                    {isFull ? (
                      <td className="py-2" data-testid={`futures-realized-pnl-${position.id}`}>
                        {realizedPnl ? (
                          <PositionPnlMoney
                            amount={realizedPnl}
                            currency={position.margin_currency}
                            signed
                            className="text-sm tabular-nums"
                          />
                        ) : (
                          <span className="text-foreground-muted">—</span>
                        )}
                      </td>
                    ) : null}

                    {isFull && showSltpEditAction ? (
                      <td
                        className="py-2 tabular-nums"
                        data-testid={`futures-stop-loss-${position.id}`}
                      >
                        {formatSltpDisplay(position.stop_loss)}
                      </td>
                    ) : null}

                    {isFull && showSltpEditAction ? (
                      <td
                        className="py-2 tabular-nums"
                        data-testid={`futures-take-profit-${position.id}`}
                      >
                        {formatSltpDisplay(position.take_profit)}
                      </td>
                    ) : null}

                    {showActionColumn ? (
                      <td className="py-2">
                        {isOpen ? (
                          <div className="flex flex-wrap gap-2">
                            {rowMarginAdjust ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                data-testid={`futures-margin-adjust-${position.id}`}
                                disabled={actionBusy}
                                loading={rowMarginAdjusting}
                                onClick={() => openMarginAdjustDialog(position)}
                              >
                                {t('trade.marginAdjustBtn')}
                              </Button>
                            ) : null}

                            {showPartialCloseAction ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                data-testid={`futures-partial-close-${position.id}`}
                                disabled={actionBusy}
                                loading={rowPartialClosing}
                                onClick={() => openPartialCloseDialog(position)}
                              >
                                {t('trade.partialCloseBtn')}
                              </Button>
                            ) : null}

                            {showSltpEditAction ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                data-testid={`futures-sltp-edit-${position.id}`}
                                disabled={actionBusy}
                                loading={rowSltpEditing}
                                onClick={() => openSltpEditDialog(position)}
                              >
                                {t('trade.tpSlEditBtn')}
                              </Button>
                            ) : null}

                            {showCloseAction ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                data-testid={`futures-close-position-${position.id}`}
                                disabled={actionBusy}
                                loading={rowClosing}
                                onClick={() => onClosePosition?.(position.id)}
                              >
                                {t('trade.closePositionBtn')}
                              </Button>
                            ) : null}
                          </div>
                        ) : null}
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={partialCloseDialogOpen}
        onOpenChange={(open) => {
          if (!open) closePartialCloseDialog();
        }}
        title={t('confirm.futuresPartialClose.titleGeneric')}
        description={t('confirm.futuresPartialClose.description')}
        summary={
          partialCloseTarget ? (
            <dl className="m-0 grid gap-3">
              <div className="flex justify-between gap-3">
                <dt className="text-foreground-muted">{t('confirm.row.market')}</dt>

                <dd className="text-foreground m-0 tabular-nums">{partialCloseTarget.market}</dd>
              </div>

              <div className="flex justify-between gap-3">
                <dt className="text-foreground-muted">{t('confirm.row.side')}</dt>

                <dd className="text-foreground m-0">
                  {t(partialCloseTarget.side === 'long' ? 'trade.long' : 'trade.short')}
                </dd>
              </div>

              <div className="flex justify-between gap-3">
                <dt className="text-foreground-muted">{t('confirm.row.amount')}</dt>

                <dd className="text-foreground m-0 tabular-nums">{partialCloseTarget.quantity}</dd>
              </div>

              <div className="grid gap-2">
                <dt className="text-foreground-muted">{t('confirm.row.closeRatio')}</dt>

                <dd className="m-0 flex flex-wrap gap-2">
                  {FUTURES_PARTIAL_CLOSE_RATIO_PRESETS.map((ratio) => {
                    const active = selectedRatio === ratio;

                    return (
                      <Button
                        key={ratio}
                        type="button"
                        size="sm"
                        variant={active ? 'primary' : 'outline'}
                        data-testid={`futures-partial-close-ratio-${ratio}`}
                        aria-pressed={active}
                        disabled={partialCloseDialogBusy}
                        onClick={() => setSelectedRatio(ratio)}
                      >
                        {formatPartialCloseRatioLabel(ratio)}
                      </Button>
                    );
                  })}
                </dd>
              </div>

              <p className="text-foreground-muted m-0 text-xs">{t('confirm.serverPriceNote')}</p>
            </dl>
          ) : null
        }
        confirmLabel={t('confirm.proceed')}
        onConfirm={submitPartialClose}
        loading={partialCloseDialogBusy}
        destructive
      />

      <ConfirmDialog
        open={marginAdjustDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeMarginAdjustDialog();
        }}
        title={t('confirm.futuresMarginAdjust.title')}
        description={t('confirm.futuresMarginAdjust.description')}
        summary={
          marginAdjustTarget ? (
            <dl className="m-0 grid gap-3">
              <div className="flex justify-between gap-3">
                <dt className="text-foreground-muted">{t('confirm.row.market')}</dt>

                <dd className="text-foreground m-0 tabular-nums">{marginAdjustTarget.market}</dd>
              </div>

              <div className="flex justify-between gap-3">
                <dt className="text-foreground-muted">{t('confirm.row.side')}</dt>

                <dd className="text-foreground m-0">
                  {t(marginAdjustTarget.side === 'long' ? 'trade.long' : 'trade.short')}
                </dd>
              </div>

              <div className="flex justify-between gap-3">
                <dt className="text-foreground-muted">{t('confirm.row.currentMargin')}</dt>

                <dd className="text-foreground m-0 tabular-nums">
                  <MoneyDisplay
                    amount={marginAdjustTarget.margin_amount}
                    currency={marginAdjustTarget.margin_currency}
                    showCurrency
                    className="text-foreground text-sm tabular-nums"
                  />
                </dd>
              </div>

              <div className="grid gap-2">
                <dt className="text-foreground-muted">{t('confirm.row.marginDelta')}</dt>

                <dd className="m-0 flex flex-wrap gap-2">
                  {(['add', 'remove'] as const).map((direction) => {
                    const active = marginAdjustDirection === direction;

                    return (
                      <Button
                        key={direction}
                        type="button"
                        size="sm"
                        variant={active ? 'primary' : 'outline'}
                        data-testid={`futures-margin-adjust-direction-${direction}`}
                        aria-pressed={active}
                        disabled={marginAdjustDialogBusy}
                        onClick={() => setMarginAdjustDirection(direction)}
                      >
                        {t(
                          direction === 'add'
                            ? 'trade.marginAdjustAdd'
                            : 'trade.marginAdjustRemove',
                        )}
                      </Button>
                    );
                  })}
                </dd>
              </div>

              <div className="grid gap-2">
                <label
                  className="text-foreground-muted text-xs"
                  htmlFor="futures-margin-adjust-amount"
                >
                  {t('trade.marginAdjustAmount')}
                </label>

                <Input
                  id="futures-margin-adjust-amount"
                  inputMode="decimal"
                  autoComplete="off"
                  data-testid="futures-margin-adjust-amount"
                  value={marginAdjustAmount}
                  disabled={marginAdjustDialogBusy}
                  invalid={
                    marginAdjustAmount.length > 0 &&
                    !canSubmitMarginAdjust(
                      marginAdjustDirection,

                      marginAdjustAmount,

                      marginAdjustTarget,
                    )
                  }
                  onChange={(event) =>
                    setMarginAdjustAmount(normalizeDecimalInput(event.target.value))
                  }
                />
              </div>

              <p className="text-foreground-muted m-0 text-xs">{t('confirm.serverPriceNote')}</p>
            </dl>
          ) : null
        }
        confirmLabel={t('confirm.proceed')}
        onConfirm={submitMarginAdjust}
        confirmDisabled={!marginAdjustConfirmEnabled}
        loading={marginAdjustDialogBusy}
      />

      <ConfirmDialog
        open={sltpEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeSltpEditDialog();
        }}
        title={t('confirm.futuresSltpEdit.title')}
        description={t('confirm.futuresSltpEdit.description')}
        summary={
          sltpEditTarget ? (
            <dl className="m-0 grid gap-3">
              <div className="flex justify-between gap-3">
                <dt className="text-foreground-muted">{t('confirm.row.market')}</dt>
                <dd className="text-foreground m-0 tabular-nums">{sltpEditTarget.market}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-foreground-muted">{t('confirm.row.side')}</dt>
                <dd className="text-foreground m-0">
                  {t(sltpEditTarget.side === 'long' ? 'trade.long' : 'trade.short')}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-foreground-muted">{t('trade.entryPrice')}</dt>
                <dd className="text-foreground m-0 tabular-nums">{sltpEditTarget.entry_price}</dd>
              </div>
              <div className="grid gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={tpEnabled}
                    disabled={sltpDialogBusy}
                    onChange={(event) => setTpEnabled(event.target.checked)}
                  />
                  {t('trade.order.tpEnable')}
                </label>
                {tpEnabled ? (
                  <Input
                    inputMode="decimal"
                    autoComplete="off"
                    data-testid="futures-sltp-edit-tp-price"
                    value={tpPrice}
                    disabled={sltpDialogBusy}
                    invalid={
                      tpPrice.length > 0 &&
                      !validatePositionTakeProfit(
                        sltpEditTarget.side,
                        sltpEditTarget.entry_price,
                        tpPrice,
                      )
                    }
                    aria-label={t('trade.order.tp')}
                    onChange={(event) => setTpPrice(normalizeDecimalInput(event.target.value))}
                  />
                ) : null}
              </div>
              {trailingStopEnabled ? (
                <div className="grid gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={trailingEnabled}
                      disabled={sltpDialogBusy}
                      onChange={(event) => {
                        setTrailingEnabled(event.target.checked);
                        if (event.target.checked) setSlEnabled(false);
                      }}
                      data-testid="futures-trailing-stop-enable"
                    />
                    {t('trade.order.trailingStop')}
                  </label>
                  {trailingEnabled ? (
                    <>
                      <Input
                        inputMode="decimal"
                        data-testid="futures-trailing-callback-rate"
                        value={trailingCallbackRate}
                        disabled={sltpDialogBusy}
                        aria-label={t('trade.order.trailingCallback')}
                        onChange={(event) =>
                          setTrailingCallbackRate(normalizeDecimalInput(event.target.value))
                        }
                      />
                      <Input
                        inputMode="decimal"
                        data-testid="futures-trailing-activation-price"
                        value={trailingActivationPrice}
                        disabled={sltpDialogBusy}
                        placeholder={t('trade.order.trailingActivation')}
                        aria-label={t('trade.order.trailingActivation')}
                        onChange={(event) =>
                          setTrailingActivationPrice(normalizeDecimalInput(event.target.value))
                        }
                      />
                    </>
                  ) : null}
                </div>
              ) : null}
              <div className="grid gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={slEnabled}
                    disabled={sltpDialogBusy || trailingEnabled}
                    onChange={(event) => setSlEnabled(event.target.checked)}
                  />
                  {t('trade.order.slEnable')}
                </label>
                {slEnabled && !trailingEnabled ? (
                  <Input
                    inputMode="decimal"
                    autoComplete="off"
                    data-testid="futures-sltp-edit-sl-price"
                    value={slPrice}
                    disabled={sltpDialogBusy}
                    invalid={
                      slPrice.length > 0 &&
                      !validatePositionStopLoss(
                        sltpEditTarget.side,
                        sltpEditTarget.entry_price,
                        slPrice,
                      )
                    }
                    aria-label={t('trade.order.sl')}
                    onChange={(event) => setSlPrice(normalizeDecimalInput(event.target.value))}
                  />
                ) : null}
              </div>
              {trailingStopEnabled &&
              sltpEditTarget?.trailing_stop_callback_rate &&
              onClearTrailingStop ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={sltpDialogBusy}
                  data-testid="futures-trailing-stop-clear"
                  onClick={() => {
                    onClearTrailingStop(sltpEditTarget.id);
                    setSltpEditTarget(null);
                  }}
                >
                  {t('trade.trailingStop.cleared')}
                </Button>
              ) : null}
              <p className="text-foreground-muted m-0 text-xs">{t('confirm.serverPriceNote')}</p>
            </dl>
          ) : null
        }
        confirmLabel={t('confirm.proceed')}
        onConfirm={submitSltpEdit}
        confirmDisabled={!sltpEditConfirmEnabled}
        loading={sltpDialogBusy}
      />
    </section>
  );
}
