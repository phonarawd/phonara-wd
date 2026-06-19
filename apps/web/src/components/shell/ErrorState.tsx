import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { t } from "@/i18n";

interface ErrorStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  /** Optional error code rendered as a mono pill above the title (Binance grammar). */
  code?: string;
  onRetry?: () => void;
  retryLabel?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * shell/ErrorState — next-action error surface.
 * Defaults to state.error.* i18n. Mirrors shell/EmptyState shape.
 * Tone: muted destructive — no apology copy, retry-forward.
 */
export function ErrorState({
  icon,
  title,
  description,
  code,
  onRetry,
  retryLabel,
  action,
  className,
}: ErrorStateProps) {
  const resolvedAction =
    action ??
    (onRetry ? (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex min-h-10 items-center justify-center rounded-md border border-(--color-down)/40 bg-(--color-surface) px-3 text-xs font-medium text-foreground hover:bg-(--color-surface-elev) focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {retryLabel ?? t("state.error.retry")}
      </button>
    ) : null);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-(--color-down)/30 bg-(--color-down)/5 px-6 py-12 text-center " +
        (className ?? "")
      }
    >
      <div className="grid size-12 place-items-center rounded-full bg-(--color-down)/15 text-(--color-down)">
        {icon ?? <AlertTriangle className="size-5" aria-hidden />}
      </div>
      {code ? (
        <div className="inline-flex items-center gap-1.5 rounded-full border border-(--color-down)/30 bg-(--color-down)/10 px-2 py-0.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("state.error.code")}
          </span>
          <span className="font-mono text-[11px] font-semibold text-(--color-down) tabular-nums">
            {code}
          </span>
        </div>
      ) : null}
      <h3 className="text-base font-medium text-foreground">
        {title ?? t("state.error.title")}
      </h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        {description ?? t("state.error.description")}
      </p>
      {resolvedAction ? <div className="mt-2">{resolvedAction}</div> : null}
    </div>
  );
}
