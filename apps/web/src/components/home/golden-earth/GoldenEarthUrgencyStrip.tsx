import { t, getLocale } from "@/i18n";

type GoldenEarthUrgencyStripProps = {
  remaining: number;
  visible: boolean;
};

const fmt = (n: number, locale: string) =>
  new Intl.NumberFormat(locale === "ko" ? "ko-KR" : "en-US").format(n);

export function GoldenEarthUrgencyStrip({ remaining, visible }: GoldenEarthUrgencyStripProps) {
  if (!visible) return null;

  const locale = getLocale();

  return (
    <div className="flex flex-col gap-1">
      <span className="animate-fomo-tick inline-flex w-fit rounded-full bg-(--color-warn)/15 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-foreground">
        {t("earn.goldenEarth.urgency", { remaining: fmt(remaining, locale) })}
      </span>
      <p className="text-[11px] tabular-nums text-muted-foreground">
        {t("earn.goldenEarth.milestone.remaining", { remaining: fmt(remaining, locale) })}
      </p>
    </div>
  );
}

GoldenEarthUrgencyStrip.displayName = "GoldenEarthUrgencyStrip";
