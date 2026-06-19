import { useMemo, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { t } from "@/i18n";

import { LiveWinTicker } from "@/components/casino/LiveWinTicker";
import {
  CasinoCategoryTabs,
  type CasinoCategory,
} from "@/components/casino/CasinoCategoryTabs";
import { HotGamesRow } from "@/components/casino/HotGamesRow";
import { SearchTrigger } from "@/components/casino/search/SearchTrigger";
import { TournamentsSection } from "@/components/casino/TournamentsSection";
import { CasinoToTradeTeaserCard } from "@/components/casino/CasinoToTradeTeaserCard";
import { GameCard } from "@/components/casino/GameCard";

import crashPoster from "@/assets/casino/crash-poster";
import plinkoPoster from "@/assets/casino/plinko-poster";
import minesPoster from "@/assets/casino/mines-poster";
import dicePoster from "@/assets/casino/dice-poster";
import limboPoster from "@/assets/casino/limbo-poster";
import hiloPoster from "@/assets/casino/hilo-poster";
import blackjackPoster from "@/assets/casino/blackjack-poster";
import roulettePoster from "@/assets/casino/roulette-poster";
import mintReelsPoster from "@/assets/casino/mint-reels-poster";
import goldRushPoster from "@/assets/casino/gold-rush-poster";
import deepshaftPoster from "@/assets/casino/deepshaft-poster";
import momentumPoster from "@/assets/casino/momentum-poster";

// Casino landing ??Stake-style simplified lobby. NO `src/games/` imports.
type Game = {
  to: string;
  name: string;
  rtp: number;
  live: number;
  poster: string;
  tone?: string;
  cat: CasinoCategory[];
};

const GAMES: Game[] = [
  { to: "/casino/crash", name: "Crash", rtp: 99.0, live: 18420, poster: crashPoster.url, tone: "from-rose-500/20 to-transparent", cat: ["originals", "crash"] },
  { to: "/casino/plinko", name: "Plinko", rtp: 99.0, live: 14260, poster: plinkoPoster.url, tone: "from-emerald-500/20 to-transparent", cat: ["originals"] },
  { to: "/casino/mines", name: "Mines", rtp: 99.0, live: 11840, poster: minesPoster.url, tone: "from-amber-500/20 to-transparent", cat: ["originals"] },
  { to: "/casino/dice", name: "Dice", rtp: 99.0, live: 9730, poster: dicePoster.url, tone: "from-sky-500/20 to-transparent", cat: ["originals"] },
  { to: "/casino/limbo", name: "Limbo", rtp: 99.0, live: 7510, poster: limboPoster.url, tone: "from-violet-500/20 to-transparent", cat: ["originals", "crash"] },
  { to: "/casino/hilo", name: "Hi-Lo", rtp: 99.0, live: 5840, poster: hiloPoster.url, tone: "from-teal-500/20 to-transparent", cat: ["originals"] },
  { to: "/casino/blackjack", name: "Blackjack", rtp: 99.5, live: 4120, poster: blackjackPoster.url, tone: "from-emerald-500/20 to-transparent", cat: ["live", "new"] },
  { to: "/casino/roulette", name: "Roulette", rtp: 97.3, live: 3260, poster: roulettePoster.url, tone: "from-rose-500/20 to-transparent", cat: ["live"] },
  { to: "/casino/mint-reels", name: "Mint Reels", rtp: 96.5, live: 2180, poster: mintReelsPoster.url, tone: "from-cyan-500/20 to-transparent", cat: ["slots", "new"] },
  { to: "/casino/gold-rush", name: "Gold Rush", rtp: 96.8, live: 1860, poster: goldRushPoster.url, tone: "from-amber-500/20 to-transparent", cat: ["slots"] },
  { to: "/casino/deepshaft", name: "Deepshaft", rtp: 99.0, live: 1540, poster: deepshaftPoster.url, tone: "from-amber-500/20 to-transparent", cat: ["originals", "new"] },
  { to: "/casino/momentum", name: "Momentum", rtp: 99.0, live: 1280, poster: momentumPoster.url, tone: "from-violet-500/20 to-transparent", cat: ["originals", "new"] },
];

export function ImportedCasinoPage() {
  const [tab, setTab] = useState<CasinoCategory>("hot");

  const filtered = useMemo(
    () => (tab === "hot" ? GAMES : GAMES.filter((g) => g.cat.includes(tab))),
    [tab],
  );

  return (
    <AppShell density="app">
      <div className="mx-auto grid w-full max-w-[1400px] gap-4 p-3 pb-24 md:p-5">
        {/* Sticky search + thin live ticker ??Stake top-of-lobby pattern */}
        <header className="sticky top-0 z-10 -mx-3 grid gap-2 bg-background/85 px-3 py-2 backdrop-blur md:-mx-5 md:px-5">
          <h1 className="sr-only">{t("casino.landing.title")}</h1>
          <SearchTrigger />
          <LiveWinTicker />
        </header>

        <CasinoCategoryTabs active={tab} onChange={setTab} />

        {tab === "hot" && <HotGamesRow />}

        <section className="grid gap-3">
          <h2 className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t(`casino.tabs.${tab}`)}
          </h2>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filtered.map((g) => (
              <GameCard key={g.to} {...g} />
            ))}
          </div>
        </section>

        {tab === "hot" && (
          <details className="group rounded-lg border border-border bg-(--color-surface) open:pb-2">
            <summary className="cursor-pointer list-none px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground">
              {t("casino.section.tournaments") ?? "Tournaments"}
              <span className="ml-2 text-foreground/40 transition-transform group-open:rotate-180 inline-block">▼</span>
            </summary>
            <div className="px-3">
              <TournamentsSection />
            </div>
          </details>
        )}

        <CasinoToTradeTeaserCard />

      </div>
    </AppShell>
  );
}
