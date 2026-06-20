import { t, getLocale } from "@/i18n";

type GoldenEarthCounterProps = {
  globalCount: number;
  personalTaps: number;
  bumpTick: number;
};

const fmt = (n: number, locale: string) =>
  new Intl.NumberFormat(locale === "ko" ? "ko-KR" : "en-US").format(n);

export function GoldenEarthCounter({ globalCount, personalTaps, bumpTick }: GoldenEarthCounterProps) {
  const locale = getLocale();

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-(--color-primary)">
        {t("earn.goldenEarth.eyebrow")}
      </p>
      <h1 className="text-lg font-bold leading-tight md:text-2xl">{t("earn.goldenEarth.headline")}</h1>
      <p className="text-xs text-muted-foreground md:text-sm">{t("earn.goldenEarth.subline")}</p>
      <div className="mt-2 flex flex-col gap-0.5">
        <p className="text-[11px] text-muted-foreground">{t("earn.goldenEarth.counter.label")}</p>
        <p
          key={bumpTick}
          aria-live="polite"
          className="animate-fomo-tick text-xl font-bold tabular-nums text-foreground md:text-2xl"
        >
          {fmt(globalCount, locale)}
        </p>
        <p className="text-[11px] tabular-nums text-muted-foreground">
          {t("earn.goldenEarth.counter.personal", { count: personalTaps })}
        </p>
      </div>
    </div>
  );
}

GoldenEarthCounter.displayName = "GoldenEarthCounter";
