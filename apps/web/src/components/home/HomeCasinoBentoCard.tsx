import { t } from "@/i18n";
import { BentoCell } from "./BentoCell";

/**
 * Phase 12-F.2 - Home Bento - Casino cell -> /casino.
 * Separate from HomeGamesTeaserCard (full-width -> /games, R-F2.5).
 */
export function HomeCasinoBentoCard() {
  return (
    <BentoCell
      data-hub-id="home-casino"
      to="/casino"
      title={t("home.bento.casinoLabel")}
      cta={t("home.section.games.cta")}
      accent="primary"
    />
  );
}
