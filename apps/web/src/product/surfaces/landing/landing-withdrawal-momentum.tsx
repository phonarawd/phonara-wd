import { useT } from '@/product/i18n';
import { cn } from '@/product/primitives/lib/cn';

export type LandingWithdrawalMomentumProps = {
  count: number | null;
  className?: string;
};

/** L0b withdrawal momentum — LIVE CMS count only · hidden when count unavailable (Phase 4). */
export function LandingWithdrawalMomentum({ count, className }: LandingWithdrawalMomentumProps) {
  const t = useT();

  if (count === null || count <= 0) return null;

  return (
    <p
      className={cn(
        'text-foreground m-0 text-sm font-medium tabular-nums [word-break:keep-all]',
        className,
      )}
      data-testid="landing-withdrawal-momentum"
      aria-live="polite"
    >
      {t('landing.proof.withdrawalMomentum', { count: count.toLocaleString('en-US') })}
    </p>
  );
}
