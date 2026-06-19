import { t } from "@/i18n";
import { BentoCell } from "./BentoCell";

export function HomeTradeTeaserCard() {
  return (
    <BentoCell
      data-hub-id="home-trade"
      to="/trade"
      title={t("home.section.trade.title")}
      desc={t("home.section.trade.desc")}
      cta={t("home.section.trade.cta")}
    />
  );
}
