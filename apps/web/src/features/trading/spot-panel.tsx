import { useMemo, useState } from 'react';
import { useSpotActions, type SpotMarket } from '../../hooks/use-trading';
import { computeSpotBuy, computeSpotSell } from '@phonara/trading-engine';
import { formatMoney, ConfirmDialog, Button, Card, Stat, Input, SegmentedControl } from '@phonara/ui';
import { isPositiveAmount } from '../../lib/money-display';
import { normalizeDecimalInput } from '../../lib/money-input';
import { useT } from '../../lib/i18n';

export function SpotPanel({
  market, price, usdtAvail, phonAvail, priceStale, realtimeDisconnected,
}: {
  market: SpotMarket | null;
  price: string;
  usdtAvail: string;
  phonAvail: string;
  priceStale: boolean;
  realtimeDisconnected: boolean;
}) {
  const t = useT();
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('10');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { buy, sell, busy, error } = useSpotActions();
  const [msg, setMsg] = useState<string | null>(null);
  const staleReason = t('trade.dataStatus.staleDescription');
  const realtimeReason = t('trade.dataStatus.realtimeDisconnectedDescription');
  const disabledReason = priceStale ? staleReason : realtimeDisconnected ? realtimeReason : undefined;

  // Estimate via the canonical Decimal spot engine (matches the SQL settlement
  // exactly: same 0.1% fee + 6dp truncation), never JS float arithmetic.
  const estimate = useMemo<string | null>(() => {
    try {
      if (!isPositiveAmount(price) || !isPositiveAmount(amount)) return null;
      return tab === 'buy'
        ? computeSpotBuy({ price, feeRate: '0.001', usdtSpent: amount }).netPhon
        : computeSpotSell({ price, feeRate: '0.001', phonSold: amount }).netUsdt;
    } catch {
      return null;
    }
  }, [amount, tab, price]);

  async function submit() {
    if (priceStale || realtimeDisconnected) return;
    setMsg(null);
    const r = tab === 'buy' ? await buy(amount) : await sell(amount);
    setConfirmOpen(false);
    if (r) {
      setMsg(tab === 'buy'
        ? t('trade.buyDone', { amount: formatMoney(String(r['phon_received']), 'PHON') })
        : t('trade.sellDone', { amount: formatMoney(String(r['usdt_received']), 'USDT') }));
    }
  }

  return (
    <Card className="flex flex-col gap-3 p-[18px]">
      <h3 className="text-[1.05rem] font-bold text-fg">{market?.display_name ?? t('trade.spotTitle')}</h3>
      <div className="text-center text-[1.1rem] font-bold text-primary">
        {t('trade.spotRate', { price: formatMoney(price, 'USDT') })}
      </div>

      <SegmentedControl<'buy' | 'sell'>
        value={tab}
        onChange={setTab}
        options={[
          { value: 'buy', label: t('trade.buy'), tone: 'up' },
          { value: 'sell', label: t('trade.sell'), tone: 'down' },
        ]}
      />

      <div className="field-row">
        <label>{tab === 'buy' ? t('trade.payUsdt') : t('trade.sellPhonLabel')}</label>
        <Input
          inputMode="decimal"
          value={amount}
          onChange={e => setAmount(normalizeDecimalInput(e.target.value))}
          className="flex-1 min-w-0 text-right"
        />
      </div>
      <div className="field-hint">
        {t('wallet.available')}: {tab === 'buy'
          ? formatMoney(usdtAvail, 'USDT')
          : formatMoney(phonAvail, 'PHON')}
      </div>

      <div className="flex flex-col gap-1.5 rounded-xl bg-surface-2/60 px-3 py-2.5">
        <Stat
          label={t('trade.estReceiveFee')}
          value={`${formatMoney(estimate ?? '0', tab === 'buy' ? 'PHON' : 'USDT')} ${tab === 'buy' ? 'PHON' : 'USDT'}`}
        />
      </div>

      {error && <p className="card-error">{t(error)}</p>}
      {msg && <p className="trade-success">{msg}</p>}

      <span className="block" title={disabledReason}>
        <Button
          variant={tab === 'buy' ? 'success' : 'danger'}
          full
          data-testid="spot-submit"
          disabled={busy || !estimate || priceStale || realtimeDisconnected}
          onClick={() => setConfirmOpen(true)}
        >
          {busy ? t('common.processing') : tab === 'buy' ? t('trade.buyPhon') : t('trade.sellPhonBtn')}
        </Button>
      </span>

      <ConfirmDialog
        open={confirmOpen}
        title={t(tab === 'buy' ? 'confirm.spotBuy.title' : 'confirm.spotSell.title')}
        description={t('confirm.serverPriceNote')}
        tone={tab === 'buy' ? 'primary' : 'danger'}
        rows={[
          {
            label: t('confirm.row.pay'),
            value: `${formatMoney(amount, tab === 'buy' ? 'USDT' : 'PHON')} ${tab === 'buy' ? 'USDT' : 'PHON'}`,
          },
          {
            label: t('confirm.row.estReceive'),
            value: `${formatMoney(estimate ?? '0', tab === 'buy' ? 'PHON' : 'USDT')} ${tab === 'buy' ? 'PHON' : 'USDT'}`,
          },
        ]}
        confirmLabel={tab === 'buy' ? t('trade.buyPhon') : t('trade.sellPhonBtn')}
        cancelLabel={t('common.cancel')}
        processingLabel={t('common.processing')}
        busy={busy}
        testId="spot"
        onConfirm={() => void submit()}
        onCancel={() => setConfirmOpen(false)}
      />
    </Card>
  );
}
