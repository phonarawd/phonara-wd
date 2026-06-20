import { t } from "@/i18n";

export type SurvivalParticipantCounterProps = {
  count: number;
  bumpTick: number;
};

const formatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });

export function SurvivalParticipantCounter({ count, bumpTick }: SurvivalParticipantCounterProps) {
  return (
    <p
      data-testid="survival-participant-counter"
      aria-live="polite"
      className="text-sm tabular-nums text-muted-foreground"
      key={bumpTick}
    >
      {t("earn.survival.counter.label", { count: formatter.format(count) })}
    </p>
  );
}

SurvivalParticipantCounter.displayName = "SurvivalParticipantCounter";
