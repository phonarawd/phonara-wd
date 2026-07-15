import { useT } from '@/product/i18n';
import { Button } from '@/product/primitives/button';
import { cn } from '@/product/primitives/lib/cn';

export type CasinoBetMode = 'manual' | 'auto';

export type BetModeTabsProps = {
  mode: CasinoBetMode;
  onChange: (mode: CasinoBetMode) => void;
  disabled?: boolean;
  className?: string;
};

/** Manual / Auto equal tabs — modal-only auto forbidden (CASINO_UX_CANON). */
export function BetModeTabs({ mode, onChange, disabled = false, className }: BetModeTabsProps) {
  const t = useT();

  return (
    <div
      className={cn('grid grid-cols-2 gap-2', className)}
      role="tablist"
      aria-label={t('casino.auto.tabManual')}
      data-testid="casino-bet-mode-tabs"
    >
      <Button
        type="button"
        role="tab"
        size="sm"
        variant={mode === 'manual' ? 'primary' : 'outline'}
        aria-selected={mode === 'manual'}
        disabled={disabled}
        data-testid="casino-bet-mode-manual"
        onClick={() => onChange('manual')}
      >
        {t('casino.auto.tabManual')}
      </Button>
      <Button
        type="button"
        role="tab"
        size="sm"
        variant={mode === 'auto' ? 'primary' : 'outline'}
        aria-selected={mode === 'auto'}
        disabled={disabled}
        data-testid="casino-bet-mode-auto"
        onClick={() => onChange('auto')}
      >
        {t('casino.auto.tabAuto')}
      </Button>
    </div>
  );
}
