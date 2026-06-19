import { t } from "@/i18n";

/**
 * Phase 12-B Footer #18 — note + learnMore only. Pure display.
 */
export function Phase12MissionsFooter() {
  return (
    <footer className="mt-4 grid gap-1 border-t border-border pt-3 text-[11px] text-muted-foreground">
      <p>{t("mission.footer.note")}</p>
      <p>
        <a
          href="/help"
          className="underline underline-offset-2 hover:text-foreground"
        >
          {t("mission.footer.learnMore")}
        </a>
      </p>
    </footer>
  );
}
