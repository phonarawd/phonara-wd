/**
 * P1.3 ??Casino game metadata (presentation-only).
 *
 * Static per-game RTP / volatility / bet bands / paired games / 24h stats.
 * Consumed by GameDetailFrame on /casino/<game> routes. Engine NEVER imports.
 *
 * Game IDs match route slugs in src/routes/casino.<slug>.tsx.
 */

import crashPoster from "@/assets/casino/crash-poster";
import plinkoPoster from "@/assets/casino/plinko-poster";
import minesPoster from "@/assets/casino/mines-poster";
import dicePoster from "@/assets/casino/dice-poster";
import limboPoster from "@/assets/casino/limbo-poster";
import hiloPoster from "@/assets/casino/hilo-poster";
import blackjackPoster from "@/assets/casino/blackjack-poster";
import roulettePoster from "@/assets/casino/roulette-poster";
import goldRushPoster from "@/assets/casino/gold-rush-poster";
import mintReelsPoster from "@/assets/casino/mint-reels-poster";
import deepshaftPoster from "@/assets/casino/deepshaft-poster";
import momentumPoster from "@/assets/casino/momentum-poster";

export type CasinoGameId =
  | "crash"
  | "plinko"
  | "mines"
  | "dice"
  | "limbo"
  | "hilo"
  | "blackjack"
  | "roulette"
  | "gold-rush"
  | "mint-reels"
  | "deepshaft"
  | "momentum";

/** Display name as it appears inside LIVE_WIN_FEED game tags. */
export type FeedGameName =
  | "Crash"
  | "Plinko"
  | "Mines"
  | "Dice"
  | "Limbo"
  | "Hi-Lo"
  | "Blackjack"
  | "Roulette"
  | "Mint Reels"
  | "Gold Rush"
  | "Deepshaft"
  | "Momentum";

export type Volatility = "low" | "medium" | "high" | "extreme";

export type TopWin24h = {
  user: string;
  amountKrw: number;
  multiplier: number;
};

export type CasinoGameMeta = {
  id: CasinoGameId;
  nameKey: string;
  nameAscii: string;
  feedName: FeedGameName;
  poster: string;
  rtp: number;
  volatility: Volatility;
  minBet: string;
  maxBet: string;
  liveSeed: number;
  paired: readonly CasinoGameId[];
  bets24h: number;
  maxWin24hKrw: number;
  avgMultiplier: number;
  tone: string;
  /** Accent hex used for hero glow ring (GPU-only). */
  accentHex: string;
  to: string;
  /** Top single win in last 24h ??deterministic mock. */
  topWin24h: TopWin24h;
  /** 3 ASCII i18n keys describing how to play. */
  howToPlayKeys: readonly [string, string, string];
};

const ALL: Record<CasinoGameId, CasinoGameMeta> = {
  crash: {
    id: "crash",
    nameKey: "casino.game.crash.name",
    nameAscii: "Crash",
    feedName: "Crash",
    poster: crashPoster.url,
    rtp: 99.0,
    volatility: "extreme",
    minBet: "\u20A9100",
    maxBet: "\u20A95,000,000",
    liveSeed: 3128,
    paired: ["limbo", "dice", "plinko", "mines"],
    bets24h: 184_207,
    maxWin24hKrw: 42_180_000,
    avgMultiplier: 2.14,
    tone: "from-rose-500/25 to-transparent",
    to: "/casino/crash",
    accentHex: "#f43f5e",
    topWin24h: { user: "pilot_42", amountKrw: 42180000, multiplier: 412.5 },
    howToPlayKeys: ["casino.detail.howToPlay.crash.s1", "casino.detail.howToPlay.crash.s2", "casino.detail.howToPlay.crash.s3"],
  },
  plinko: {
    id: "plinko",
    nameKey: "casino.game.plinko.name",
    nameAscii: "Plinko",
    feedName: "Plinko",
    poster: plinkoPoster.url,
    rtp: 99.0,
    volatility: "medium",
    minBet: "\u20A9100",
    maxBet: "\u20A92,000,000",
    liveSeed: 2475,
    paired: ["crash", "mines", "dice", "limbo"],
    bets24h: 142_640,
    maxWin24hKrw: 18_420_000,
    avgMultiplier: 1.42,
    tone: "from-emerald-500/25 to-transparent",
    to: "/casino/plinko",
    accentHex: "#10b981",
    topWin24h: { user: "drop.king", amountKrw: 18420000, multiplier: 184.2 },
    howToPlayKeys: ["casino.detail.howToPlay.plinko.s1", "casino.detail.howToPlay.plinko.s2", "casino.detail.howToPlay.plinko.s3"],
  },
  mines: {
    id: "mines",
    nameKey: "casino.game.mines.name",
    nameAscii: "Mines",
    feedName: "Mines",
    poster: minesPoster.url,
    rtp: 99.0,
    volatility: "high",
    minBet: "\u20A9100",
    maxBet: "\u20A91,000,000",
    liveSeed: 1982,
    paired: ["dice", "crash", "limbo", "hilo"],
    bets24h: 98_120,
    maxWin24hKrw: 24_700_000,
    avgMultiplier: 1.86,
    tone: "from-amber-500/25 to-transparent",
    to: "/casino/mines",
    accentHex: "#f59e0b",
    topWin24h: { user: "sap.7", amountKrw: 24700000, multiplier: 247.0 },
    howToPlayKeys: ["casino.detail.howToPlay.mines.s1", "casino.detail.howToPlay.mines.s2", "casino.detail.howToPlay.mines.s3"],
  },
  dice: {
    id: "dice",
    nameKey: "casino.game.dice.name",
    nameAscii: "Dice",
    feedName: "Dice",
    poster: dicePoster.url,
    rtp: 99.0,
    volatility: "low",
    minBet: "\u20A9100",
    maxBet: "\u20A93,000,000",
    liveSeed: 1647,
    paired: ["limbo", "crash", "hilo", "plinko"],
    bets24h: 121_540,
    maxWin24hKrw: 9_840_000,
    avgMultiplier: 1.18,
    tone: "from-sky-500/25 to-transparent",
    to: "/casino/dice",
    accentHex: "#0ea5e9",
    topWin24h: { user: "d6.lord", amountKrw: 9840000, multiplier: 98.4 },
    howToPlayKeys: ["casino.detail.howToPlay.dice.s1", "casino.detail.howToPlay.dice.s2", "casino.detail.howToPlay.dice.s3"],
  },
  limbo: {
    id: "limbo",
    nameKey: "casino.game.limbo.name",
    nameAscii: "Limbo",
    feedName: "Limbo",
    poster: limboPoster.url,
    rtp: 99.0,
    volatility: "extreme",
    minBet: "\u20A9100",
    maxBet: "\u20A92,000,000",
    liveSeed: 1284,
    paired: ["crash", "dice", "plinko", "hilo"],
    bets24h: 87_320,
    maxWin24hKrw: 31_500_000,
    avgMultiplier: 2.42,
    tone: "from-violet-500/25 to-transparent",
    to: "/casino/limbo",
    accentHex: "#8b5cf6",
    topWin24h: { user: "void.x", amountKrw: 31500000, multiplier: 315.0 },
    howToPlayKeys: ["casino.detail.howToPlay.limbo.s1", "casino.detail.howToPlay.limbo.s2", "casino.detail.howToPlay.limbo.s3"],
  },
  hilo: {
    id: "hilo",
    nameKey: "casino.game.hilo.name",
    nameAscii: "Hi-Lo",
    feedName: "Hi-Lo",
    poster: hiloPoster.url,
    rtp: 99.0,
    volatility: "medium",
    minBet: "\u20A9100",
    maxBet: "\u20A91,500,000",
    liveSeed: 932,
    paired: ["blackjack", "dice", "mines", "plinko"],
    bets24h: 54_810,
    maxWin24hKrw: 6_240_000,
    avgMultiplier: 1.34,
    tone: "from-teal-500/25 to-transparent",
    to: "/casino/hilo",
    accentHex: "#14b8a6",
    topWin24h: { user: "card.qz", amountKrw: 6240000, multiplier: 62.4 },
    howToPlayKeys: ["casino.detail.howToPlay.hilo.s1", "casino.detail.howToPlay.hilo.s2", "casino.detail.howToPlay.hilo.s3"],
  },
  blackjack: {
    id: "blackjack",
    nameKey: "casino.game.blackjack.name",
    nameAscii: "Blackjack",
    feedName: "Blackjack",
    poster: blackjackPoster.url,
    rtp: 99.5,
    volatility: "low",
    minBet: "\u20A9500",
    maxBet: "\u20A95,000,000",
    liveSeed: 1124,
    paired: ["roulette", "hilo", "mint-reels", "gold-rush"],
    bets24h: 64_280,
    maxWin24hKrw: 8_400_000,
    avgMultiplier: 1.92,
    tone: "from-emerald-600/25 to-transparent",
    to: "/casino/blackjack",
    accentHex: "#059669",
    topWin24h: { user: "split.21", amountKrw: 8400000, multiplier: 16.8 },
    howToPlayKeys: ["casino.detail.howToPlay.blackjack.s1", "casino.detail.howToPlay.blackjack.s2", "casino.detail.howToPlay.blackjack.s3"],
  },
  roulette: {
    id: "roulette",
    nameKey: "casino.game.roulette.name",
    nameAscii: "Roulette",
    feedName: "Roulette",
    poster: roulettePoster.url,
    rtp: 97.3,
    volatility: "medium",
    minBet: "\u20A9500",
    maxBet: "\u20A95,000,000",
    liveSeed: 1487,
    paired: ["blackjack", "mint-reels", "gold-rush", "hilo"],
    bets24h: 71_210,
    maxWin24hKrw: 12_600_000,
    avgMultiplier: 2.18,
    tone: "from-rose-600/25 to-transparent",
    to: "/casino/roulette",
    accentHex: "#e11d48",
    topWin24h: { user: "red.36", amountKrw: 12600000, multiplier: 35.0 },
    howToPlayKeys: ["casino.detail.howToPlay.roulette.s1", "casino.detail.howToPlay.roulette.s2", "casino.detail.howToPlay.roulette.s3"],
  },
  "gold-rush": {
    id: "gold-rush",
    nameKey: "casino.game.goldRush.name",
    nameAscii: "Gold Rush",
    feedName: "Gold Rush",
    poster: goldRushPoster.url,
    rtp: 96.5,
    volatility: "high",
    minBet: "\u20A9100",
    maxBet: "\u20A91,000,000",
    liveSeed: 2104,
    paired: ["mint-reels", "crash", "plinko", "roulette"],
    bets24h: 132_410,
    maxWin24hKrw: 28_700_000,
    avgMultiplier: 2.04,
    tone: "from-amber-600/25 to-transparent",
    to: "/casino/gold-rush",
    accentHex: "#d97706",
    topWin24h: { user: "nugget", amountKrw: 28700000, multiplier: 287.0 },
    howToPlayKeys: ["casino.detail.howToPlay.goldRush.s1", "casino.detail.howToPlay.goldRush.s2", "casino.detail.howToPlay.goldRush.s3"],
  },
  "mint-reels": {
    id: "mint-reels",
    nameKey: "casino.game.mintReels.name",
    nameAscii: "Mint Reels",
    feedName: "Mint Reels",
    poster: mintReelsPoster.url,
    rtp: 96.2,
    volatility: "medium",
    minBet: "\u20A9100",
    maxBet: "\u20A91,000,000",
    liveSeed: 1846,
    paired: ["gold-rush", "plinko", "roulette", "blackjack"],
    bets24h: 118_720,
    maxWin24hKrw: 16_840_000,
    avgMultiplier: 1.74,
    tone: "from-emerald-400/25 to-transparent",
    to: "/casino/mint-reels",
    accentHex: "#34d399",
    topWin24h: { user: "mint.fr", amountKrw: 16840000, multiplier: 168.4 },
    howToPlayKeys: ["casino.detail.howToPlay.mintReels.s1", "casino.detail.howToPlay.mintReels.s2", "casino.detail.howToPlay.mintReels.s3"],
  },
  deepshaft: {
    id: "deepshaft",
    nameKey: "casino.game.deepshaft.name",
    nameAscii: "Deepshaft",
    feedName: "Deepshaft",
    poster: deepshaftPoster.url,
    rtp: 99.0,
    volatility: "high",
    minBet: "\u20A9100",
    maxBet: "\u20A92,000,000",
    liveSeed: 1761,
    paired: ["mines", "plinko", "crash", "limbo"],
    bets24h: 76_410,
    maxWin24hKrw: 19_320_000,
    avgMultiplier: 1.96,
    tone: "from-amber-700/25 to-transparent",
    to: "/casino/deepshaft",
    accentHex: "#b45309",
    topWin24h: { user: "shaft.7", amountKrw: 19320000, multiplier: 193.2 },
    howToPlayKeys: ["casino.detail.howToPlay.deepshaft.s1", "casino.detail.howToPlay.deepshaft.s2", "casino.detail.howToPlay.deepshaft.s3"],
  },
  momentum: {
    id: "momentum",
    nameKey: "casino.game.momentum.name",
    nameAscii: "Momentum",
    feedName: "Momentum",
    poster: momentumPoster.url,
    rtp: 99.0,
    volatility: "extreme",
    minBet: "\u20A9100",
    maxBet: "\u20A92,000,000",
    liveSeed: 1432,
    paired: ["crash", "limbo", "deepshaft", "plinko"],
    bets24h: 64_820,
    maxWin24hKrw: 22_140_000,
    avgMultiplier: 2.28,
    tone: "from-violet-500/25 to-transparent",
    to: "/casino/momentum",
    accentHex: "#8b5cf6",
    topWin24h: { user: "chain.x9", amountKrw: 22140000, multiplier: 221.4 },
    howToPlayKeys: ["casino.detail.howToPlay.momentum.s1", "casino.detail.howToPlay.momentum.s2", "casino.detail.howToPlay.momentum.s3"],
  },
};

export function getGameMeta(id: CasinoGameId): CasinoGameMeta {
  return ALL[id];
}

export const ALL_GAME_IDS: readonly CasinoGameId[] = Object.keys(ALL) as CasinoGameId[];
