import { t } from "@/i18n";
import { GameCard } from "./GameCard";

import crashPoster from "@/assets/casino/crash-poster";
import plinkoPoster from "@/assets/casino/plinko-poster";
import minesPoster from "@/assets/casino/mines-poster";
import dicePoster from "@/assets/casino/dice-poster";
import limboPoster from "@/assets/casino/limbo-poster";
import hiloPoster from "@/assets/casino/hilo-poster";

/**
 * P1 쨌 Stake/Roobet rival ??HotGamesRow
 * Horizontal snap row of top games with CDN posters.
 */
type Game = {
  to: string;
  name: string;
  rtp: number;
  live: number;
  poster: string;
  tone?: string;
};

const HOT: Game[] = [
  { to: "/casino/crash", name: "Crash", rtp: 99.0, live: 18420, poster: crashPoster.url, tone: "from-rose-500/25 to-transparent" },
  { to: "/casino/plinko", name: "Plinko", rtp: 99.0, live: 14260, poster: plinkoPoster.url, tone: "from-emerald-500/25 to-transparent" },
  { to: "/casino/mines", name: "Mines", rtp: 99.0, live: 11840, poster: minesPoster.url, tone: "from-amber-500/25 to-transparent" },
  { to: "/casino/dice", name: "Dice", rtp: 99.0, live: 9730, poster: dicePoster.url, tone: "from-sky-500/25 to-transparent" },
  { to: "/casino/limbo", name: "Limbo", rtp: 99.0, live: 7510, poster: limboPoster.url, tone: "from-violet-500/25 to-transparent" },
  { to: "/casino/hilo", name: "Hi-Lo", rtp: 99.0, live: 5840, poster: hiloPoster.url, tone: "from-teal-500/25 to-transparent" },
];

export function HotGamesRow() {
  return (
    <section data-p1-id="casino-hot-row" className="grid gap-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold">
          <span className="mr-1.5">?뵦</span>
          {t("casino.hot.title")}
        </h2>
        <span className="text-[11px] text-muted-foreground">
          {t("casino.hot.subtitle")}
        </span>
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
        {HOT.map((g) => (
          <div
            key={g.to}
            className="w-[44vw] shrink-0 snap-start sm:w-[28vw] md:w-[200px]"
          >
            <GameCard {...g} />
          </div>
        ))}
      </div>
    </section>
  );
}
