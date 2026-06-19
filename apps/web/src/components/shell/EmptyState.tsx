import type { ReactNode } from "react";
import { t } from "@/i18n";

type ActionKind = "retry" | "earn" | "casino";

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  /** Next-action shortcut → emits a default CTA button wired to i18n. */
  actionKind?: ActionKind;
  /** When `actionKind` is set, called on click. Ignored if `action` is also provided. */
  onAction?: () => void;
  /** Optional secondary hint line below description; defaults to state.empty.hint when actionKind is set. */
  hint?: string;
  /** Explicit action overrides actionKind. */
  action?: ReactNode;
  className?: string;
}

const ACTION_KEY: Record<ActionKind, string> = {
  retry: "state.empty.action.retry",
  earn: "state.empty.action.earn",
  casino: "state.empty.action.casino",
};

/**
 * shell/EmptyState — Earn-first next-action empty surface.
 * Defaults to state.empty.* i18n. `actionKind` emits a tokenized CTA so
 * callers stay terse; pass `action` to fully override.
 */
export function EmptyState({
  icon,
  title,
  description,
  actionKind,
  onAction,
  hint,
  action,
  className,
}: EmptyStateProps) {
  const resolvedAction =
    action ??
    (actionKind ? (
      <button
        type="button"
        onClick={onAction}
        className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-(--color-surface) px-3 text-xs font-medium text-foreground hover:bg-(--color-surface-elev) focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {t(ACTION_KEY[actionKind])}
      </button>
    ) : null);

  return (
    <div
      role="status"
      aria-live="polite"
      className={
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-border/40 bg-muted/20 px-6 py-12 text-center " +
        (className ?? "")
      }
    >
      {icon ? <div className="text-muted-foreground" aria-hidden="true">{icon}</div> : null}
      <h3 className="text-base font-medium text-foreground">
        {title ?? t("state.empty.title")}
      </h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        {description ?? t("state.empty.description")}
      </p>
      {hint ? (
        <p className="max-w-sm text-xs text-muted-foreground/80">{hint}</p>
      ) : actionKind ? (
        <p className="max-w-sm text-xs text-muted-foreground/80">{t("state.empty.hint")}</p>
      ) : null}
      {resolvedAction ? <div className="mt-2">{resolvedAction}</div> : null}
    </div>
  );
}
