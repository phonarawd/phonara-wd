import { DA_W6_QUAD_STREAM_LOADING_AXES } from '@/domain/da-w6-brand-elevation-display-contract';
import { cn } from '@/product/primitives/lib/cn';
import { usePrefersReducedMotion } from '@/product/primitives/lib/use-prefers-reduced-motion';
import { useT } from '@/product/i18n';

export type QuadStreamLoadingProps = {
  className?: string;
  /** When true, hide the i18n title (icon-only status). */
  compact?: boolean;
  testId?: string;
};

/**
 * §34.20 Quad Stream loading signature — Earn/Trade/Sports/Casino axis pulse.
 * `prefers-reduced-motion` → static dots (L1 instant).
 */
export function QuadStreamLoading({
  className,
  compact = false,
  testId = 'quad-stream-loading',
}: QuadStreamLoadingProps) {
  const t = useT();
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3 py-8', className)}
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={t('state.loading.aria')}
      data-testid={testId}
    >
      <div
        className="ds-quad-stream-loading"
        data-static={prefersReducedMotion ? 'true' : 'false'}
        aria-hidden
      >
        {DA_W6_QUAD_STREAM_LOADING_AXES.map((axis) => (
          <span key={axis} className="ds-quad-stream-loading__axis" data-axis={axis} />
        ))}
      </div>
      {compact ? null : (
        <p className="text-foreground-muted m-0 text-sm">{t('state.loading.title')}</p>
      )}
    </div>
  );
}
