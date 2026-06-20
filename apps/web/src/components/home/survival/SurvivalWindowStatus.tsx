import { t } from "@/i18n";
import type { SurvivalWindow } from "@/hooks/useSurvivalWindow";

export type SurvivalWindowStatusProps = {
  window: SurvivalWindow;
};

export function SurvivalWindowStatus({ window }: SurvivalWindowStatusProps) {
  const statusText =
    window.phase === "before"
      ? t(window.statusKey, {
          hours: window.countdownHours,
          minutes: window.countdownMinutes,
        })
      : window.phase === "open"
        ? t(window.statusKey, { endTime: window.endTimeLabel })
        : t(window.statusKey);

  return (
    <div
      data-testid="survival-window-status"
      aria-live="polite"
      className={
        "rounded-lg border px-3 py-2 text-sm " +
        (window.phase === "open"
          ? "border-(--color-primary)/40 bg-(--color-primary)/10 text-foreground"
          : "border-border bg-card/40 text-muted-foreground")
      }
    >
      {statusText}
    </div>
  );
}

SurvivalWindowStatus.displayName = "SurvivalWindowStatus";
