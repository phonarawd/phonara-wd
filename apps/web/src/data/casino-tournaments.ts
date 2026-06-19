/**
 * P1.2 — Casino tournaments mock data.
 *
 * ASCII only (no Hangul) — display strings live in i18n catalogs as
 * `casino.tournament.<id>.title` / `.subtitle`.
 * Engine NEVER imports this — presentation-only mock.
 */

import { NICKNAME_POOL } from "./casino-feed";

const nick = (i: number): string => NICKNAME_POOL[i % NICKNAME_POOL.length] ?? "player";

export type TournamentStatus = "live" | "endingSoon" | "upcoming";

export type Tournament = {
  /** Stable id — matches i18n keys casino.tournament.<id>.* */
  id: string;
  /** Game tone class — uses Tailwind tokens only. */
  tone: string;
  /** Prize pool seed value in `currency`. */
  prize: number;
  currency: "KRW" | "USDT";
  /** Initial entries count — useLiveCount drives it. */
  entries: number;
  /** Initial ms until end — useTournamentCountdown counts down. */
  endsInMs: number;
  status: TournamentStatus;
  /** Optional accent ring color token. */
  accent: "rose" | "emerald" | "amber" | "violet" | "cyan";
};

export const TOURNAMENTS: readonly Tournament[] = [
  {
    id: "crypto_crash_cup",
    tone: "from-rose-500/20 to-transparent",
    prize: 50_000_000,
    currency: "KRW",
    entries: 8_412,
    endsInMs: 4 * 60 * 60 * 1000 + 23 * 60 * 1000,
    status: "live",
    accent: "rose",
  },
  {
    id: "plinko_pro",
    tone: "from-emerald-500/20 to-transparent",
    prize: 5_000,
    currency: "USDT",
    entries: 3_287,
    endsInMs: 11 * 60 * 60 * 1000 + 7 * 60 * 1000,
    status: "live",
    accent: "emerald",
  },
  {
    id: "slot_royale",
    tone: "from-amber-500/20 to-transparent",
    prize: 30_000_000,
    currency: "KRW",
    entries: 1_954,
    endsInMs: 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000,
    status: "upcoming",
    accent: "amber",
  },
];

export type LeaderboardEntry = {
  rank: number;
  user: string;
  wagered: number;
  currency: "KRW" | "USDT";
};

/** Top-10 + current user placeholder. Order is initial seed; sim hook reshuffles. */
export const LEADERBOARD_SEED: readonly LeaderboardEntry[] = [
  { rank: 1, user: nick(12), wagered: 184_200_000, currency: "KRW" },
  { rank: 2, user: nick(31), wagered: 162_870_000, currency: "KRW" },
  { rank: 3, user: nick(7), wagered: 148_310_000, currency: "KRW" },
  { rank: 4, user: nick(44), wagered: 11_220, currency: "USDT" },
  { rank: 5, user: nick(2), wagered: 121_900_000, currency: "KRW" },
  { rank: 6, user: nick(51), wagered: 9_640, currency: "USDT" },
  { rank: 7, user: nick(18), wagered: 98_450_000, currency: "KRW" },
  { rank: 8, user: nick(36), wagered: 7_810, currency: "USDT" },
  { rank: 9, user: nick(25), wagered: 82_300_000, currency: "KRW" },
  { rank: 10, user: nick(40), wagered: 6_120, currency: "USDT" },
];

/** Demo "you" row pinned below leaderboard. */
export const SELF_ROW: LeaderboardEntry = {
  rank: 847,
  user: "you***",
  wagered: 2_184_000,
  currency: "KRW",
};

export function formatPrize(value: number, currency: "KRW" | "USDT"): string {
  if (currency === "USDT") return `${value.toLocaleString("en-US")} USDT`;
  return `\u20A9${value.toLocaleString("en-US")}`;
}
