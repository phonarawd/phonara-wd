/**
 * PHONARA × Lovable — recent-bet row adapter.
 *
 * Dual-shape passthrough: the PHONARA adapter feeds either
 * `RecentBetStripRow` (already Lovable-shaped) or `PhonaraRecentBet`
 * (snake_case + `result_payload`). Normalize once in the game shell
 * (`crash/index.tsx`) before passing into Stage / HUD / BetHistoryStrip.
 */
import type { PhonaraRecentBet, RecentBetStripRow } from "./types";

type AnyRow = RecentBetStripRow | PhonaraRecentBet;

function isPhonara(row: AnyRow): row is PhonaraRecentBet {
  return (
    !!row &&
    typeof row === "object" &&
    ("result_payload" in row || "created_at" in row) &&
    !("at" in row && "win" in row && "multiplier" in row)
  );
}

function toEpoch(v: string | number): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Date.parse(String(v));
  return Number.isFinite(n) ? n : Date.now();
}

export function toStripRow(row: AnyRow): RecentBetStripRow {
  if (!isPhonara(row)) {
    const r = row as RecentBetStripRow;
    return r.result === undefined && (r as { result_payload?: unknown }).result_payload !== undefined
      ? { ...r, result: (r as unknown as PhonaraRecentBet).result_payload }
      : r;
  }
  const payoutNum = Number(row.payout) || 0;
  const stakeNum = Number(row.stake) || 0;
  const win = payoutNum > 0;
  const mult = stakeNum > 0 ? payoutNum / stakeNum : 0;
  return {
    id: row.id,
    game: row.game,
    currency: row.currency,
    stake: row.stake,
    payout: row.payout,
    multiplier: mult.toFixed(2),
    at: toEpoch(row.created_at),
    win,
    result: row.result_payload,
  };
}

export function normalizeRecentBets(rows: AnyRow[] | undefined | null): RecentBetStripRow[] {
  if (!rows || !Array.isArray(rows)) return [];
  return rows.map(toStripRow);
}

/**
 * Crash history multiplier — single source for the history chip strip.
 * Reads `result.crashMultiplier` (PHONARA Crash engine 1:1) and falls
 * back to `row.multiplier` when absent.
 */
export function crashHistoryMultiplier(row: RecentBetStripRow): number {
  const r = (row.result ?? {}) as { crashMultiplier?: number | string };
  const fromResult = Number(r.crashMultiplier ?? NaN);
  if (Number.isFinite(fromResult) && fromResult > 0) return fromResult;
  const fromRow = Number(row.multiplier ?? 0);
  return Number.isFinite(fromRow) && fromRow > 0 ? fromRow : 0;
}
