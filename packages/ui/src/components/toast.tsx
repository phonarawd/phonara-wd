import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

export type ToastTrack = 'trust-critical' | 'friendly';
export type ToastSeverity = 'info' | 'success' | 'warning' | 'danger';

const severityBorder: Record<ToastSeverity, string> = {
  info: 'border-l-[var(--color-info)]',
  success: 'border-l-[var(--color-trust)]',
  warning: 'border-l-[var(--color-risk)]',
  danger: 'border-l-[var(--color-danger)]',
};

export const toastVariants = cva(
  'rounded-2xl border border-l-[3px] shadow-[var(--elevation-2)] backdrop-blur-[var(--glass-blur)] animate-[pn-rise_var(--motion-duration-reveal)_var(--motion-ease-spring)_both]',
  {
  variants: {
    track: {
      'trust-critical': 'border-border bg-surface-2/95 text-fg',
      friendly: 'border-border bg-surface/95 text-fg',
    },
    tone: {
      neutral: '',
      success: 'bg-up/10',
      warning: 'bg-warning/10',
      danger: 'bg-down/10',
    },
    density: {
      compact: 'px-3 py-2',
      comfortable: 'px-4 py-3',
    },
  },
  defaultVariants: { track: 'trust-critical', tone: 'neutral', density: 'comfortable' },
});

export interface ToastProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof toastVariants> {
  track?: ToastTrack;
  severity?: ToastSeverity;
  title?: ReactNode;
  description?: ReactNode;
  /** Honored only when track is friendly — max one emoji character. */
  emoji?: string;
}

export const Toast = forwardRef<HTMLDivElement, ToastProps>(function Toast(
  {
    track = 'trust-critical',
    severity = 'info',
    tone,
    density,
    title,
    description,
    emoji,
    className,
    children,
    ...props
  },
  ref,
) {
  const showEmoji = track === 'friendly' && emoji ? emoji.slice(0, 2) : null;
  const resolvedTone = tone ?? (severity === 'success' ? 'success' : severity === 'warning' ? 'warning' : severity === 'danger' ? 'danger' : 'neutral');

  return (
    <div
      ref={ref}
      role={severity === 'danger' || severity === 'warning' ? 'alert' : 'status'}
      className={cn(
        toastVariants({ track, tone: resolvedTone, density }),
        severityBorder[severity],
        className,
      )}
      {...props}
    >
      {title && (
        <p className="font-semibold text-sm">
          {showEmoji && <span aria-hidden="true">{showEmoji} </span>}
          {title}
        </p>
      )}
      {description && <p className="mt-1 text-xs text-muted">{description}</p>}
      {children}
    </div>
  );
});

Toast.displayName = 'Toast';
