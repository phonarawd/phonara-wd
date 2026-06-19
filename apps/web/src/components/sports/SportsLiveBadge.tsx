import { t } from "@/i18n";

export function SportsLiveBadge() {
  return (
    <span
      className="inline-flex h-5 items-center gap-1 rounded-full bg-(--color-down)/15 px-1.5 text-[10px] font-bold uppercase tracking-wider text-(--color-down)"
      aria-label={t("sports.live.badge")}
    >
      <span
        aria-hidden
        className="relative inline-block size-1.5 rounded-full bg-(--color-down) motion-safe:after:absolute motion-safe:after:inset-0 motion-safe:after:rounded-full motion-safe:after:bg-(--color-down)/60 motion-safe:after:animate-ping motion-reduce:after:hidden"
      />
      {t("sports.live.badge")}
    </span>
  );
}
