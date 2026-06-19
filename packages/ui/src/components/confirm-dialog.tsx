import { forwardRef, useId } from 'react';
import { cn } from '../lib/cn';
import { Button } from './button';
import { Modal } from './modal';

export interface ConfirmRow {
  /** Pre-translated label. */
  label: string;
  /** Pre-formatted value (use @phonara/money formatters for amounts). */
  value: string;
  /** `danger` renders the value in the down/loss color (e.g. liquidation price). */
  tone?: 'default' | 'danger';
  /** Hero emphasis for primary monetary totals in the summary. */
  emphasis?: 'default' | 'hero';
  /** Allow long values such as wallet addresses or risk notes to wrap in full. */
  wrap?: boolean;
}

export interface ConfirmDialogProps {
  open: boolean;
  /** Pre-translated title. */
  title: string;
  /** Optional pre-translated description / risk note. */
  description?: string;
  /** Optional summary rows (amounts, fees, leverage, ...). */
  rows?: readonly ConfirmRow[];
  /** Pre-translated confirm button label. */
  confirmLabel: string;
  /** Pre-translated cancel button label. */
  cancelLabel: string;
  /** Pre-translated label shown on the confirm button while `busy`. */
  processingLabel?: string;
  /** Visual weight of the confirm action. */
  tone?: 'primary' | 'danger';
  /** Disables actions and blocks dismissal while a request is in-flight. */
  busy?: boolean;
  /** Extra guard (e.g. stale price or drifted inputs) — confirm stays disabled even when not busy. */
  confirmDisabled?: boolean;
  /** Pre-translated inline notice (e.g. price changed, stale oracle). */
  notice?: string;
  /** Visual weight for `notice`. */
  noticeTone?: 'warning' | 'danger';
  /** Optional base test id; applied as `${testId}-confirm` / `${testId}-cancel`. */
  testId?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * High-risk action confirmation. i18n-agnostic by design: the caller passes
 * already-translated strings (rule 60 + rule 85), so this stays reusable across
 * web and admin. Built on the Modal primitive and the shared Button.
 */
export const ConfirmDialog = forwardRef<HTMLDivElement, ConfirmDialogProps>(function ConfirmDialog(
  {
    open,
    title,
    description,
    rows = [],
    confirmLabel,
    cancelLabel,
    processingLabel,
    tone = 'primary',
    busy = false,
    confirmDisabled = false,
    notice,
    noticeTone = 'warning',
    testId,
    onConfirm,
    onCancel,
  },
  ref,
) {
  const titleId = useId();
  const descId = useId();
  const noticeId = useId();
  const confirmBlocked = busy || confirmDisabled;
  const describedBy = [description ? descId : null, notice ? noticeId : null].filter(Boolean).join(' ') || undefined;

  return (
    <Modal
      ref={ref}
      open={open}
      onClose={onCancel}
      dismissible={!busy}
      labelledBy={titleId}
      describedBy={describedBy}
      testId={testId}
    >
      <h2 id={titleId} className="text-[length:var(--text-subheading)] font-[var(--font-weight-heading)] leading-[var(--text-subheading--line-height)] text-fg">
        {title}
      </h2>
      {description && (
        <p id={descId} className="mt-1.5 text-sm text-muted">
          {description}
        </p>
      )}

      {notice && (
        <p
          id={noticeId}
          className={cn(
            'mt-3 rounded-xl border px-3 py-2 text-sm leading-snug shadow-[var(--surface-highlight)]',
            noticeTone === 'danger'
              ? 'border-down/40 bg-down/10 text-down'
              : 'border-warning/40 bg-warning/10 text-warning',
          )}
          data-testid={testId ? `${testId}-notice` : undefined}
        >
          {notice}
        </p>
      )}

      {rows.length > 0 && (
        <dl className="mt-4 flex flex-col gap-2 rounded-2xl border border-border bg-surface-inset px-4 py-3 shadow-[var(--surface-inset-shadow)]">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-4 text-sm"
            >
              <dt className="text-muted">{row.label}</dt>
              <dd
                className={cn(
                  'font-semibold tabular-nums',
                  row.wrap
                    ? 'max-w-[min(18rem,60vw)] whitespace-normal break-words text-right leading-snug'
                    : 'whitespace-nowrap',
                  row.emphasis === 'hero' && 'text-[length:var(--money-hero-size)] font-[var(--money-hero-weight)] tracking-[var(--tracking-title)]',
                  row.tone === 'danger' ? 'text-down' : 'text-fg',
                )}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-6 flex gap-3">
        <Button
          variant="ghost"
          className="flex-none"
          onClick={onCancel}
          disabled={busy}
          data-testid={testId ? `${testId}-cancel` : undefined}
        >
          {cancelLabel}
        </Button>
        <Button
          variant={tone === 'danger' ? 'danger' : 'primary'}
          full
          onClick={onConfirm}
          disabled={confirmBlocked}
          loading={busy}
          loadingLabel={processingLabel}
          data-testid={testId ? `${testId}-confirm` : undefined}
        >
          {busy ? (processingLabel ?? confirmLabel) : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
});

ConfirmDialog.displayName = 'ConfirmDialog';
