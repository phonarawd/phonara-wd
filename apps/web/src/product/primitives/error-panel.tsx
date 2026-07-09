import { AlertCircle, ShieldAlert } from 'lucide-react';

import { useT } from '@/product/i18n';
import { Button } from '@/product/primitives/button';
import { cn } from '@/product/primitives/lib/cn';

export type ErrorPanelVariant = 'network' | 'forbidden';

export interface ErrorPanelProps {
  variant: ErrorPanelVariant;
  /** Optional stable error code for network failures. */
  errorCode?: string;
  onRetry?: () => void;
  onBack?: () => void;
  className?: string;
}

/** §25.15 — network retry vs forbidden back (no retry). */
export function ErrorPanel({ variant, errorCode, onRetry, onBack, className }: ErrorPanelProps) {
  const t = useT();
  const isNetwork = variant === 'network';
  const Icon = isNetwork ? AlertCircle : ShieldAlert;
  const titleKey = isNetwork ? 'state.error.title' : 'state.forbidden.title';
  const descriptionKey = isNetwork ? 'state.error.description' : 'state.forbidden.description';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-(--ds-radius-lg) border border-line',
        'bg-surface px-6 py-10 text-center',
        className,
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon className="size-10 text-foreground-muted" aria-hidden />
      <div className="flex max-w-sm flex-col gap-1.5">
        <h3 className="text-base font-semibold text-foreground">{t(titleKey)}</h3>
        <p className="text-sm text-foreground-muted">{t(descriptionKey)}</p>
        {isNetwork && errorCode ? (
          <p className="text-xs text-foreground-muted">
            {t('state.error.code')}: {errorCode}
          </p>
        ) : null}
      </div>
      {isNetwork && onRetry ? (
        <Button variant="primary" size="md" onClick={onRetry}>
          {t('state.error.retry')}
        </Button>
      ) : null}
      {!isNetwork && onBack ? (
        <Button variant="secondary" size="md" onClick={onBack}>
          {t('state.forbidden.back')}
        </Button>
      ) : null}
    </div>
  );
}
