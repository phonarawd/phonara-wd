import { t } from "@/i18n";

export function HomeHubFooter() {
  return (
    <footer className="mt-4 grid gap-1 border-t border-border pt-3 text-[11px] text-muted-foreground">
      <p>{t("home.footer.note")}</p>
      <p>
        <a
          href="/help"
          className="underline underline-offset-2 hover:text-foreground"
        >
          {t("home.footer.learnMore")}
        </a>
      </p>
    </footer>
  );
}
