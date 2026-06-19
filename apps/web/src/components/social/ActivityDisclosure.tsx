import { t } from "@/i18n";

/**
 * ActivityDisclosure — small text strip used in footers / drawers
 * to disclose synthetic activity. Wave 1 LOCK: must always be present
 * wherever marquee/pulse/ticker render.
 */
export function ActivityDisclosure() {
  return (
    <p
      data-testid="activity-disclosure"
      className="px-3 py-2 text-[11px] leading-relaxed text-muted-foreground"
    >
      {t("social.proof.disclosure.text")}
    </p>
  );
}
