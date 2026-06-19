import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import { t } from "@/i18n";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  /** Optional error code rendered as a mono pill above the title. */
  code?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title,
  description,
  code,
  onRetry,
  retryLabel,
  className,
}: ErrorStateProps) {
  const _title = title ?? t("common.error.title");
  const _desc = description ?? t("common.error.desc");
  const _retry = retryLabel ?? t("common.error.retry");
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-(--color-down)/30 bg-(--color-down)/5 px-6 py-10 text-center",
        className,
      )}
      role="alert"
    >
      <div className="grid size-12 place-items-center rounded-full bg-(--color-down)/15 text-(--color-down)">
        <AlertTriangle className="size-5" aria-hidden />
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
      <div className="grid gap-1">
        <div className="text-sm font-medium text-foreground">{_title}</div>
        <div className="text-xs text-muted-foreground">{_desc}</div>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-(--color-surface) px-3 text-xs font-medium hover:bg-(--color-surface-elev) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
        >
          {_retry}
        </button>
      ) : null}
    </div>
  );
}
