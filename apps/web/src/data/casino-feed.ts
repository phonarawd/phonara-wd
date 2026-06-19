/**
 * P1.1a — Casino live-feed mock data.
 *
 * ASCII only (no Hangul) — translations live in i18n catalogs.
 * Nicknames mix Korean-romanized + Western to feel like a 1M-user platform.
 * Used by LiveWinTicker (and any future feed surface).
 */

/** Pre-masked nicknames (60 total). Mix of romanized KR + EN. No duplicates. */
export const NICKNAME_POOL: readonly string[] = [
  // Korean-romanized (30)
  "yuna**",
  "minho*",
  "kj***",
  "soo***",
  "han**",
  "lee***",
  "park**",
  "jin***",
  "junho***",
  "jihoon**",
  "sojin**",
  "seoyeon*",
  "haeun**",
  "dohyun**",
  "minjae*",
  "yejin***",
  "taeho**",
  "hyerim*",
  "kyungh**",
  "namjoo*",
  "jisoo***",
  "wonsik*",
  "byungh**",
  "chanwoo*",
  "eunha**",
  "gyuri***",
  "iseul**",
  "junseo**",
  "miran**",
  "sungho*",
  // Western (30)
  "alex_***",
  "mike91*",
  "sergey**",
  "akira***",
  "lucia**",
  "noah_**",
  "elena***",
  "mateo**",
  "kai_***",
  "zara**",
  "dmitri*",
  "carlos**",
  "ingrid*",
  "rafa***",
  "leila**",
  "viktor*",
  "natalia*",
  "owen_**",
  "amir***",
  "fatima*",
  "tom88**",
  "nina_**",
  "diego**",
  "soraya*",
  "henrik*",
  "milena*",
  "khalid*",
  "renata*",
  "yuto***",
  "anya_**",
];

/** Display currency code + symbol. Mock-only — engine NEVER imports this. */
export type FeedCurrency = "KRW" | "USDT";

/** Weighted currency mix per North Star KR-first tone. */
export const CURRENCY_POOL: readonly FeedCurrency[] = [
  "KRW",
  "KRW",
  "KRW",
  "KRW",
  "KRW",
  "KRW",
  "KRW",
  "USDT",
  "USDT",
  "USDT",
];

/** Game labels — keep ASCII; UI maps to i18n via casino.game.<id>.name keys. */
export const GAME_POOL: readonly string[] = [
  "Crash",
  "Plinko",
  "Mines",
  "Dice",
  "Limbo",
  "Hi-Lo",
  "Blackjack",
  "Roulette",
  "Mint Reels",
  "Gold Rush",
];

export type LiveWin = {
  user: string;
  game: string;
  currency: FeedCurrency;
  amount: number;
};

/** Stable mock feed (60 entries, no duplicate user/game pairs in the visible window). */
export const LIVE_WIN_FEED: readonly LiveWin[] = NICKNAME_POOL.map((user, i) => {
  const game = GAME_POOL[i % GAME_POOL.length] ?? "Crash";
  const currency = CURRENCY_POOL[i % CURRENCY_POOL.length] ?? "KRW";
  const bands = [
    98_000, 187_500, 332_000, 521_000, 982_400, 1_284_000, 1_675_000,
    2_047_000, 2_840_000, 4_210_000,
  ];
  const band = bands[i % 10] ?? 98_000;
  const amount = currency === "USDT" ? Math.round(band / 1320) : band;
  return { user, game, currency, amount };
});

/** Format helper — keep deterministic (no locale=undefined). */
export function formatFeedAmount(win: LiveWin): string {
  if (win.currency === "USDT") {
    return `${win.amount.toLocaleString("en-US")} USDT`;
  }
  return `\u20A9${win.amount.toLocaleString("en-US")}`;
}
