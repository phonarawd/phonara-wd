import { t } from "@/i18n";
import { LiveWinMarquee } from "../LiveWinMarquee";
import { HomeCompactWalletStrip } from "../HomeCompactWalletStrip";
import { GoldenEarthHero } from "../golden-earth";
import { HomeEarnPowerRow } from "../HomeEarnPowerRow";
import { HomeCategoryRow, type CategoryCard } from "../HomeCategoryRow";
import { TierProgressChip } from "../TierProgressChip";
import posterCrash from "@/assets/casino/crash-poster";
import posterPlinko from "@/assets/casino/plinko-poster";
import posterMines from "@/assets/casino/mines-poster";
import posterDice from "@/assets/casino/dice-poster";
import posterRoulette from "@/assets/casino/roulette-poster";
import posterBlackjack from "@/assets/casino/blackjack-poster";
import posterHilo from "@/assets/casino/hilo-poster";
import posterLimbo from "@/assets/casino/limbo-poster";
import posterGold from "@/assets/casino/gold-rush-poster";
import posterMint from "@/assets/casino/mint-reels-poster";
import posterTournaments from "@/assets/casino/tournaments-poster";
import posterFairness from "@/assets/casino/fairness-poster";
import posterSpot from "@/assets/casino/spot-poster";
import posterStaking from "@/assets/casino/staking-poster";
import posterTier from "@/assets/casino/tier-poster";
import posterSports from "@/assets/casino/sports-poster";

const CASINO_CARDS: ReadonlyArray<CategoryCard> = [
  { id: "crash", to: "/casino/crash", title: "Crash", badge: "HOT", poster: posterCrash.url },
  { id: "plinko", to: "/casino/plinko", title: "Plinko", poster: posterPlinko.url },
  { id: "mines", to: "/casino/mines", title: "Mines", poster: posterMines.url },
  { id: "dice", to: "/casino/dice", title: "Dice", poster: posterDice.url },
  { id: "roulette", to: "/casino/roulette", title: "Roulette", poster: posterRoulette.url },
  { id: "blackjack", to: "/casino/blackjack", title: "Blackjack", poster: posterBlackjack.url },
];

const GAMES_CARDS: ReadonlyArray<CategoryCard> = [
  { id: "hilo", to: "/casino/hilo", title: "Hi-Lo", poster: posterHilo.url },
  { id: "limbo", to: "/casino/limbo", title: "Limbo", poster: posterLimbo.url },
  { id: "gold", to: "/casino/gold-rush", title: "Gold Rush", badge: "NEW", poster: posterGold.url },
  { id: "mint", to: "/casino/mint-reels", title: "Mint Reels", poster: posterMint.url },
  { id: "tournaments", to: "/casino/tournaments", title: "Tournaments", poster: posterTournaments.url },
  { id: "fairness", to: "/casino/fairness", title: "Fairness", poster: posterFairness.url },
];

const TRADE_CARDS: ReadonlyArray<CategoryCard> = [
  { id: "trade", to: "/trade", title: "Spot", poster: posterSpot.url },
  { id: "stake", to: "/staking", title: "Staking", poster: posterStaking.url },
  { id: "tier", to: "/tier", title: "Tier", poster: posterTier.url },
  { id: "sports", to: "/sports", title: "Sports", poster: posterSports.url },
];

export function HomeTodayPanel() {
  return (
    <div className="flex min-w-0 flex-col gap-3" data-hub-id="home-today">
      {/* Compact wallet strip */}
      <HomeCompactWalletStrip />

      <GoldenEarthHero />

      {/* Earn power row ??stake-style horizontal scroll */}
      <HomeEarnPowerRow />

      {/* FOMO ticker ??exactly one */}
      <section aria-label={t("home.fomo.lane.ticker.label")}>
        <LiveWinMarquee />
      </section>

      {/* Tier chip ??1 row */}
      <TierProgressChip />

      {/* Below-fold stake-style rows */}
      <HomeCategoryRow
        titleKey="home.row.casino.title"
        seeAllTo="/casino"
        cards={CASINO_CARDS}
        testId="home-row-casino"
        variant="tile"
      />
      <HomeCategoryRow
        titleKey="home.row.games.title"
        seeAllTo="/games"
        cards={GAMES_CARDS}
        testId="home-row-games"
        variant="tile"
      />
      <HomeCategoryRow
        titleKey="home.row.trade.title"
        seeAllTo="/trade"
        cards={TRADE_CARDS}
        testId="home-row-trade"
        variant="tile"
      />
    </div>
  );
}
