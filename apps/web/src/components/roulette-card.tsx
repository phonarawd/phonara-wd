import { useEffect, useRef, useState } from 'react';
import { formatMoney, Badge, Button, Card } from '@phonara/ui';
import { useRoulette, ROULETTE_PRIZES } from '../hooks/use-retention';
import { useT } from '../lib/i18n';

export function RouletteCard() {
  const t = useT();
  const { spin, canSpinToday, result, spinning, loading, error } = useRoulette();
  const canSpin = canSpinToday();
  const [animIdx, setAnimIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (spinning) {
      intervalRef.current = setInterval(() => {
        setAnimIdx((prev) => (prev + 1) % ROULETTE_PRIZES.length);
      }, 120);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (result) setAnimIdx(result.prize_index);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [spinning, result]);

  const handleSpin = async () => {
    await spin();
  };

  const currentPrize = ROULETTE_PRIZES[animIdx] ?? ROULETTE_PRIZES[0];
  const wonToday = result && !result.already_spun;

  return (
    <Card className="flex flex-col gap-3.5 p-[18px]">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-sm font-bold text-accent">
          R
        </span>
        <h3 className="flex-1 text-base font-semibold text-fg">{t('roulette.title')}</h3>
        <Badge tone="info">{t('roulette.oncePerDay')}</Badge>
      </div>

      <div
        className={`flex min-h-[72px] flex-col items-center justify-center rounded-xl border px-4 py-5 text-center transition-colors ${
          spinning
            ? 'border-primary/30 bg-primary/10'
            : wonToday
              ? 'border-warning/40 bg-warning/10'
              : 'border-border bg-surface-2'
        }`}
      >
        <p
          className={`text-lg font-bold text-fg ${spinning ? 'animate-pulse' : ''}`}
          aria-live={spinning ? 'polite' : 'off'}
        >
          {t('roulette.prizePreview', { amount: formatMoney(String(currentPrize), 'PHON') })}
        </p>
        {!spinning && wonToday && (
          <p className="mt-1 text-xs text-warning">{t('roulette.wonToday', { amount: formatMoney(result.phon_awarded, 'PHON') })}</p>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-1.5">
        {ROULETTE_PRIZES.map((prize, i) => {
          const isActive = result ? i === result.prize_index : false;
          const isRare = prize >= 300;
          return (
            <span
              key={i}
              className={`rounded-lg border px-2 py-1 text-[0.68rem] font-semibold tabular-nums ${
                isActive
                  ? isRare
                    ? 'border-accent/50 bg-accent/15 text-accent'
                    : 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-transparent bg-surface-2 text-muted'
              }`}
            >
              {formatMoney(String(prize), 'PHON')}
            </span>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted">{t('roulette.expected')}</p>

      {canSpin ? (
        <Button
          variant="primary"
          full
          data-testid="roulette-spin-submit"
          onClick={handleSpin}
          disabled={loading || spinning}
        >
          {spinning ? t('roulette.spinning') : t('roulette.spin')}
        </Button>
      ) : (
        <div className="rounded-xl border border-up/20 bg-up/10 px-3 py-2.5 text-center text-sm text-up">
          {wonToday
            ? t('roulette.wonToday', { amount: formatMoney(result.phon_awarded, 'PHON') })
            : t('roulette.doneToday')}
        </div>
      )}

      {error && (
        <p className="text-center text-sm text-down" role="alert">
          {t(error)}
        </p>
      )}

      {wonToday && currentPrize >= 300 && (
        <div className="rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-center text-sm text-accent">
          {t('roulette.rareWin', { amount: formatMoney(result.phon_awarded, 'PHON') })}
        </div>
      )}
    </Card>
  );
}
