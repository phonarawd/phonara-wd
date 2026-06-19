import { t } from "@/i18n";
import { BentoCell } from "./BentoCell";

export function HomeReferralTeaserCard() {
  return (
    <BentoCell
      data-hub-id="home-referral"
      to="/referral"
      title={t("home.section.referral.title")}
      desc={t("home.section.referral.desc")}
      cta={t("home.section.referral.cta")}
    />
  );
}
