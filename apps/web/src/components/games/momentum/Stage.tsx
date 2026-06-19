/**
 * Momentum · Stage — combo ribbon + multiplier readout.
 *
 * ENGINE TRUTH (consume-only):
 *   selection: { comboBefore, cashOut }
 *   result:    { comboAfter, comboMultiplier, totalMultiplier?, won, cashedOut }
 *
 * Render rules:
 *   - Combo counter = max(selection.comboBefore, result.comboAfter)
 *   - Per-round comboMultiplier banner (always for settled rounds).
 *   - totalMultiplier banner ONLY when bet.result.cashedOut === true.
 *     During a play-win round, totalMultiplier is undefined and the
 *     bank-pop banner does NOT render — proven by orchestration case 3.
 *   - Loss → shatter (<300ms), combo collapses to 0.
 *
 * PERF: discrete CSS transforms + opacity + filter only. NO rAF.
 * Scoped <style> block — NO styles.css touches.
 */
import { useEffect, useMemo, useState } from "react";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import { FairnessSheet } from "@/games/shared/FairnessSheet";
import { useReducedMotionGuard } from "@/games/shared/hooks/useReducedMotionGuard";
import { useSound } from "@/games/shared/hooks/useSound";
import type { MomentumResult, MomentumSurfaceProps } from "./types";

type Props = Pick<
  MomentumSurfaceProps,
  | "gameCode"
  | "selection"
  | "bet"
  | "clientSeed"
  | "commitment"
  | "verification"
  | "busy"
  | "onClientSeedChange"
>;

const HEAT_COLORS = [
  "#9ca3af", // 0
  "#fbbf24", // 1
  "#fb923c", // 2
  "#f97316", // 3
  "#ef4444", // 4
  "#ec4899", // 5
  "#d946ef", // 6
  "#a855f7", // 7
  "#8b5cf6", // 8
  "#6366f1", // 9
  "#3b82f6", // 10+
];

function heat(combo: number): string {
  const i = combo < 0 ? 0 : combo > 10 ? 10 : combo;
  return HEAT_COLORS[i] ?? HEAT_COLORS[0] ?? "#6366f1";
}

const ROLL_REVEAL_MS = 900;
const ROLL_THRESHOLD = "52.00";

export function Stage(p: Props) {
  const reduced = useReducedMotionGuard();
  const { play } = useSound();

  // ENGINE TRUTH — read straight from bet.result, never recomputed.
  const settle = (p.bet?.result ?? {}) as Partial<MomentumResult>;
  const settled = Boolean(p.bet);
  const cashedOut = settle.cashedOut === true;
  const won = settle.won === true;
  const comboMultDisplay = settle.comboMultiplier;
  const totalMultDisplay = settle.totalMultiplier;
  const comboAfter = settle.comboAfter ?? p.selection.comboBefore;
  const rawRoll = settle.roll;
  const hasRoll = typeof rawRoll === "number";

  // Combo number on display: live = selection.comboBefore; settled = comboAfter.
  const displayCombo = settled ? comboAfter : p.selection.comboBefore;

  // Bet fingerprint — drives reveal scheduling + settle sound dedupe.
  const betFp =
    p.bet?.bet_id ??
    (settled
      ? `${comboMultDisplay}|${String(cashedOut)}|${String(won)}|${comboAfter}|${String(rawRoll)}`
      : null);

  // LAW 4 roll-reveal: quarantine outcome banners + roll digits until
  // reveal completes. CashOut path skips the reveal (no roll anim).
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (!settled) {
      setRevealed(false);
      return;
    }
    if (cashedOut || reduced) {
      setRevealed(true);
      return;
    }
    setRevealed(false);
    let alive = true;
    const id = window.setTimeout(() => {
      if (alive) setRevealed(true);
    }, ROLL_REVEAL_MS);
    return () => {
      alive = false;
      window.clearTimeout(id);
    };
  }, [betFp, settled, cashedOut, reduced]);

  // Settle sound: one shot per distinct bet.
  const [lastBetId, setLastBetId] = useState<string | null>(null);
  useEffect(() => {
    if (!settled) {
      setLastBetId(null);
      return;
    }
    const fp = betFp ?? "_";
    if (lastBetId === fp) return;
    setLastBetId(fp);
    play(won ? "win" : "lose");
  }, [settled, betFp, won, lastBetId, play]);

  // Banners — gated by reveal for play path; cashout reveals immediately.
  const showRollPanel = settled && !cashedOut && hasRoll;
  const showWinBurst = settled && won && !cashedOut && revealed;
  const showShatter = settled && !won && revealed;
  const showBankPop = settled && cashedOut;
  const showStepMult = settled && Boolean(comboMultDisplay) && (cashedOut || revealed);

  // Decorative ribbon tint based on display combo.
  const tint = useMemo(() => heat(displayCombo), [displayCombo]);

  // Final roll readout — only rendered after reveal. Pre-reveal shows
  // a static placeholder so the number never leaks into the DOM.
  const rollText = revealed && hasRoll ? rawRoll!.toFixed(2) : "--.--";

  return (
    <div
      data-testid="casino-stage"
      data-game="momentum"
      data-reveal={settled ? (revealed ? "complete" : "pending") : "idle"}
      className="relative grid gap-4 overflow-hidden rounded-2xl border border-violet-700/40 ring-1 ring-violet-300/5 bg-gradient-to-b from-stone-950 via-stone-950 to-black p-4"
    >
      {/* Ambient ribbon wash — color-temp escalates with combo. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-[background] duration-300"
        style={{
          background: `radial-gradient(ellipse at center, ${tint}33, transparent 60%), radial-gradient(ellipse at center bottom, rgba(0,0,0,0.4), transparent 70%)`,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent"
      />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em]" style={{ color: tint }}>
          <Zap aria-hidden className="size-3.5" />
          Momentum · {t("games.momentum.combo")}
        </div>
        <FairnessSheet
          gameCode={"momentum" as never}
          clientSeed={p.clientSeed}
          commitment={p.commitment}
          verification={p.verification}
          onClientSeedChange={p.onClientSeedChange}
        />
      </div>

      {/* Combo counter — huge tabular-nums readout. CLS=0. */}
      <div
        data-testid="momentum-combo-display"
        className="relative grid place-items-center rounded-xl border border-violet-700/30 bg-black/60 px-3 py-6"
      >
        <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {t("games.momentum.combo")}
        </div>
        <div
          data-testid="momentum-combo-number"
          className={cn(
            "font-mono text-6xl font-black tabular-nums leading-none transition-[transform,color] duration-200",
            showWinBurst && !reduced && "mWinPulse",
            showShatter && !reduced && "mShake",
          )}
          style={{ color: tint, textShadow: `0 0 24px ${tint}66` }}
        >
          ×{displayCombo}
        </div>

        {/* Live per-round multiplier readout — gated by reveal for play. */}
        {showStepMult && (
          <div
            data-testid="momentum-step-mult"
            className="mt-2 text-sm font-semibold tabular-nums"
            style={{ color: tint }}
          >
            {comboMultDisplay}×
          </div>
        )}
      </div>

      {/* Roll-reveal panel — play path only. Threshold 52.00 is a static
          constant (not an outcome token). The roll number itself is
          quarantined until `revealed === true`. */}
      {showRollPanel && (
        <div
          data-testid="momentum-roll-reveal"
          data-revealed={revealed ? "true" : "false"}
          className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-lg border border-cyan-500/30 bg-black/50 px-3 py-2"
          aria-live="polite"
          aria-busy={!revealed}
        >
          <div className="grid">
            <span className="text-[9px] uppercase tracking-[0.22em] text-cyan-300/70">
              {t("games.momentum.roll")}
            </span>
            <span
              data-testid="momentum-roll-digits"
              className={cn(
                "font-mono text-3xl font-bold tabular-nums leading-none text-cyan-100",
                !revealed && !reduced && "mScramble",
              )}
              style={{ textShadow: revealed ? "0 0 18px rgba(34,211,238,0.55)" : "none" }}
            >
              {rollText}
            </span>
          </div>
          <div
            aria-hidden
            className="h-10 w-px bg-gradient-to-b from-transparent via-cyan-400/40 to-transparent"
          />
          <div className="grid justify-items-end">
            <span className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
              {t("games.momentum.threshold")}
            </span>
            <span className="font-mono text-3xl font-bold tabular-nums leading-none text-muted-foreground">
              {ROLL_THRESHOLD}
            </span>
          </div>
        </div>
      )}

      {/* Banners — engine truth. */}
      {showWinBurst && (
        <div
          data-testid="momentum-banner-win"
          className={cn(
            "relative grid place-items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2",
            !reduced && "mWinBurst",
          )}
        >
          <span className="text-[10px] uppercase tracking-[0.22em] text-amber-200/80">
            {t("games.momentum.chainExtended")}
          </span>
          <span className="font-mono text-2xl font-bold tabular-nums text-amber-200">
            {comboMultDisplay}×
          </span>
        </div>
      )}

      {showShatter && (
        <div
          data-testid="momentum-banner-bust"
          className={cn(
            "relative grid place-items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2",
            !reduced && "mShatter",
          )}
        >
          <span className="text-[10px] uppercase tracking-[0.22em] text-rose-200/80">
            {t("games.momentum.bust")}
          </span>
          <span className="font-mono text-2xl font-bold tabular-nums text-rose-200">
            ×0
          </span>
        </div>
      )}

      {showBankPop && totalMultDisplay && (
        <div
          data-testid="momentum-banner-cashout"
          className={cn(
            "relative grid place-items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2",
            !reduced && "mBankPop",
          )}
        >
          <span className="text-[10px] uppercase tracking-[0.22em] text-emerald-200/80">
            {t("games.momentum.banked")}
          </span>
          <span
            data-testid="momentum-banner-cashout-total"
            className="font-mono text-2xl font-bold tabular-nums text-emerald-200"
          >
            {totalMultDisplay}×
          </span>
        </div>
      )}

      {/* Scoped keyframes — discrete CSS transforms only. */}
      <style>{`
        @keyframes mWinBurst {
          0% { transform: scale(0.96); opacity: 0; }
          55% { transform: scale(1.03); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .mWinBurst { animation: mWinBurst 280ms ease-out both; }
        @keyframes mWinPulse {
          0% { transform: scale(1); }
          45% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        .mWinPulse { animation: mWinPulse 240ms ease-out both; }
        @keyframes mShatter {
          0% { transform: translateY(-2px) scale(0.97); opacity: 0; filter: blur(2px); }
          50% { transform: translateY(1px) scale(1.01); opacity: 1; filter: blur(0); }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        .mShatter { animation: mShatter 280ms ease-out both; }
        @keyframes mShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-3px); }
          40% { transform: translateX(3px); }
          60% { transform: translateX(-2px); }
          80% { transform: translateX(2px); }
        }
        .mShake { animation: mShake 220ms ease-out both; }
        @keyframes mBankPop {
          0% { transform: scale(0.94); opacity: 0; }
          60% { transform: scale(1.04); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .mBankPop { animation: mBankPop 260ms ease-out both; }
        @keyframes mScramble {
          0%, 100% { opacity: 0.6; filter: blur(0.4px); }
          50% { opacity: 1; filter: blur(0); }
        }
        .mScramble { animation: mScramble 220ms ease-in-out infinite; }
      `}</style>
    </div>
  );
}
