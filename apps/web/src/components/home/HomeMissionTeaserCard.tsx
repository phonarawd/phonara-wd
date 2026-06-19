import { t } from "@/i18n";
import { BentoCell } from "./BentoCell";

export function HomeMissionTeaserCard() {
  return (
    <BentoCell
      data-hub-id="home-mission"
      to="/earn/missions"
      title={t("home.section.mission.title")}
      desc={t("home.section.mission.desc")}
      cta={t("home.section.mission.cta")}
    />
  );
}
