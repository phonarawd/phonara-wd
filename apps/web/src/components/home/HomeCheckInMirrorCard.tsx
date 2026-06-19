import { t } from "@/i18n";
import { BentoCell } from "./BentoCell";

/**
 * H2 - check-in mirror card. UI label only.
 * 12-B contract NO-TOUCH (no earn-hub component imports).
 */
export function HomeCheckInMirrorCard() {
  return (
    <BentoCell
      data-hub-id="home-checkin"
      to="/earn"
      title={t("home.section.checkin.title")}
      desc={t("home.section.checkin.desc")}
      cta={t("home.section.checkin.cta")}
    />
  );
}
