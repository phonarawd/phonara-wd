import { t } from "@/i18n";

interface LoadingShellProps {
  variant?: "page" | "card" | "inline";
  label?: string;
  className?: string;
}

/**
 * shell/LoadingShell — standardized loading surface.
 * variant=page: full-route placeholder; card: section placeholder; inline: small.
 */
export function LoadingShell({
  variant = "card",
  label,
  className,
}: LoadingShellProps) {
  const ariaLabel = label ?? t("state.loading.aria");
  const base =
    "animate-pulse rounded-xl bg-muted/40 " +
    (variant === "page"
      ? "min-h-[60dvh] w-full"
      : variant === "inline"
        ? "h-4 w-24"
        : "h-32 w-full");
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={ariaLabel}
      className={base + " " + (className ?? "")}
    >
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
}
