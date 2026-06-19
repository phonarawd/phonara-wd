import { t } from "@/i18n";

/**
 * Phase 12-B Hero — mount only. Pure display label.
 * No calc, no state, no network. A/B 6-id schema untouched.
 */
export function MissionProgressHero() {
  return (
    <header className="mb-4 grid gap-1">
      <h2 className="text-base font-semibold">
        {t("earn.missions.head.title")}
      </h2>
      <p className="text-xs text-muted-foreground">
        {t("earn.missions.head.desc")}
      </p>
    </header>
  );
}
